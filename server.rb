# server.rb - Aureon Travel REST API & Web Server (Ruby WEBrick)
# Ishga tushirish uchun: ruby server.rb

require 'webrick'
require 'json'
require 'net/http'
require 'uri'
require 'fileutils'

ROOT = File.expand_path(File.dirname(__FILE__))
PORT = ENV['PORT'] ? ENV['PORT'].to_i : 3000
DB_FILE = File.join(ROOT, 'data', 'db.json')

# 1. Ma'lumotlar bazasini o'qish va yozish
def read_db
  unless File.exist?(DB_FILE)
    FileUtils.mkdir_p(File.dirname(DB_FILE))
    initial = {
      "tours" => [],
      "bookings" => [],
      "settings" => {
        "exchangeRate" => 12800,
        "telegram" => { "botToken" => "", "chatId" => "", "enabled" => false },
        "adminPassword" => "admin"
      }
    }
    File.write(DB_FILE, JSON.pretty_generate(initial))
    return initial
  end
  JSON.parse(File.read(DB_FILE))
rescue => e
  warn "DB o'qishda xatolik: #{e.message}"
  { "tours" => [], "bookings" => [], "settings" => { "exchangeRate" => 12800, "telegram" => {}, "adminPassword" => "admin" } }
end

def write_db(data)
  FileUtils.mkdir_p(File.dirname(DB_FILE))
  File.write(DB_FILE, JSON.pretty_generate(data))
  true
rescue => e
  warn "DB yozishda xatolik: #{e.message}"
  false
end

# 2. Telegram xabarini yuborish
def send_telegram(bot_token, chat_id, text)
  return false if bot_token.to_s.strip.empty? || chat_id.to_s.strip.empty?

  uri = URI.parse("https://api.telegram.org/bot#{bot_token}/sendMessage")
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  http.open_timeout = 5
  http.read_timeout = 5

  req = Net::HTTP::Post.new(uri.request_uri, { 'Content-Type' => 'application/json' })
  req.body = {
    chat_id: chat_id,
    text: text,
    parse_mode: 'HTML'
  }.to_json

  res = http.request(req)
  res.code.to_i == 200
rescue => e
  warn "Telegram xatolik: #{e.message}"
  false
end

# 3. Yagona API va Statik Server Servlet
class ApiServerServlet < WEBrick::HTTPServlet::AbstractServlet
  def set_cors(res)
    res['Access-Control-Allow-Origin'] = '*'
    res['Access-Control-Allow-Methods'] = 'GET, POST, PATCH, PUT, DELETE, OPTIONS'
    res['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
  end

  def do_OPTIONS(req, res)
    set_cors(res)
    res.status = 200
  end

  def parse_body(req)
    return {} if req.body.nil? || req.body.strip.empty?
    JSON.parse(req.body)
  rescue
    {}
  end

  def json_response(res, status, data)
    set_cors(res)
    res.status = status
    res['Content-Type'] = 'application/json; charset=utf-8'
    res.body = data.to_json
  end

  def serve_static(req, res)
    path = req.path == '/' ? '/index.html' : req.path
    file_path = File.join(ROOT, path)

    if File.file?(file_path)
      set_cors(res)
      mime = WEBrick::HTTPUtils.mime_type(file_path, WEBrick::HTTPUtils::DefaultMimeTypes)
      res['Content-Type'] = mime
      res.body = File.read(file_path)
    else
      # SPA Fallback
      fallback = File.join(ROOT, 'index.html')
      if File.file?(fallback)
        set_cors(res)
        res['Content-Type'] = 'text/html; charset=utf-8'
        res.body = File.read(fallback)
      else
        res.status = 404
        res.body = "File Not Found"
      end
    end
  end

  def do_GET(req, res)
    set_cors(res)
    path = req.path

    case path
    when '/api/status'
      json_response(res, 200, { status: "ok", app: "Aureon Travel Ruby Backend", time: Time.now.iso8601 })

    when '/api/tours'
      db = read_db
      json_response(res, 200, db['tours'] || [])

    when '/api/bookings'
      db = read_db
      list = db['bookings'] || []
      query = req.query['query'].to_s.strip.downcase
      if !query.empty?
        clean_q = query.gsub(/\D/, '')
        list = list.select do |b|
          (b['id'].to_s.downcase.include?(query)) ||
          (!clean_q.empty? && b['guestPhone'].to_s.gsub(/\D/, '').include?(clean_q)) ||
          (b['guestName'].to_s.downcase.include?(query))
        end
      end
      json_response(res, 200, list)

    when '/api/bookings/lookup'
      db = read_db
      query = req.query['query'].to_s.strip.downcase
      clean_q = query.gsub(/\D/, '')
      results = (db['bookings'] || []).select do |b|
        b['id'].to_s.downcase == query ||
        (!clean_q.empty? && clean_q.length >= 7 && b['guestPhone'].to_s.gsub(/\D/, '').include?(clean_q))
      end.map do |b|
        {
          id: b['id'],
          tourTitle: b['tourTitleLocalized'] || b['tourTitle'],
          startDate: b['startDate'],
          startTime: b['startTime'],
          durationDays: b['durationDays'],
          status: b['status'],
          totalPrice: b['totalPrice'],
          createdAt: b['createdAt']
        }
      end
      json_response(res, 200, results)

    when '/api/settings'
      db = read_db
      s = db['settings'] || {}
      json_response(res, 200, {
        exchangeRate: s['exchangeRate'] || 12800,
        telegramEnabled: !!(s['telegram'] && s['telegram']['enabled'] && !s['telegram']['botToken'].to_s.empty?)
      })

    when '/api/settings/admin'
      db = read_db
      json_response(res, 200, db['settings'] || {})

    else
      if path.start_with?('/api/')
        json_response(res, 404, { error: "API endpoint topilmadi" })
      else
        serve_static(req, res)
      end
    end
  end

  def do_POST(req, res)
    set_cors(res)
    path = req.path
    body = parse_body(req)

    case path
    when '/api/bookings'
      db = read_db
      booking_id = body['id'].to_s.strip.empty? ? "BK-#{rand(100000..999999)}" : body['id']
      new_booking = body.merge({
        'id' => booking_id,
        'status' => body['status'] || "Kutilmoqda",
        'createdAt' => body['createdAt'] || Time.now.iso8601
      })

      db['bookings'] ||= []
      db['bookings'].unshift(new_booking)
      write_db(db)

      # Telegram xabarnoma
      tg = (db['settings'] && db['settings']['telegram']) || {}
      if tg['enabled'] && !tg['botToken'].to_s.empty? && !tg['chatId'].to_s.empty?
        sum_formatted = new_booking['totalPrice'].to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse
        text = 
"🔔 <b>YANGI ARIZA TUSHDI!</b> (Aureon Travel)

📋 <b>ID:</b> ##{new_booking['id']}
👤 <b>Mijoz:</b> #{new_booking['guestName']}
📞 <b>Telefon:</b> #{new_booking['guestPhone']}
📍 <b>Manzil:</b> #{new_booking['pickupLocation'] || new_booking['roomNumber'] || '-'}

🗺 <b>Tur:</b> #{new_booking['tourTitleLocalized'] || new_booking['tourTitle'] || '-'}
📅 <b>Sana:</b> #{new_booking['startDate']} | 🕒 #{new_booking['startTime'] || '09:00'}
⏳ <b>Davomiyligi:</b> #{new_booking['durationDays']} kun (#{new_booking['nights'] || 0} kecha)
👥 <b>Odamlar:</b> #{new_booking['adults']} nafar katta, #{new_booking['children'] || 0} nafar bola
🏨 <b>Otel:</b> #{new_booking['hotelOption'] || '-'}
🗣 <b>Gid:</b> #{new_booking['guideOption'] || '-'} (#{new_booking['guideLanguage'] || 'uz'})
💬 <b>Izoh:</b> #{new_booking['guestNote'] || "Yo'q"}

💰 <b>Jami hisob:</b> <b>#{sum_formatted} so'm</b>
📌 <b>Holati:</b> ⏳ Kutilmoqda"
        send_telegram(tg['botToken'], tg['chatId'], text)
      end

      json_response(res, 201, { success: true, booking: new_booking })

    when %r{^/api/bookings/([^/]+)/status$}
      b_id = Regexp.last_match(1)
      db = read_db
      booking = (db['bookings'] || []).find { |b| b['id'] == b_id }
      if booking
        old_status = booking['status']
        booking['status'] = body['status']
        booking['updatedAt'] = Time.now.iso8601
        write_db(db)

        tg = (db['settings'] && db['settings']['telegram']) || {}
        if tg['enabled'] && !tg['botToken'].to_s.empty? && !tg['chatId'].to_s.empty? && old_status != body['status']
          icon = body['status'] == "Tasdiqlandi" ? "✅" : (body['status'] == "Bekor qilindi" ? "❌" : "⏳")
          text = 
"#{icon} <b>BUYURTMA HOLATI O'ZGARDI</b>

📋 <b>ID:</b> ##{booking['id']}
👤 <b>Mijoz:</b> #{booking['guestName']}
📞 <b>Tel:</b> #{booking['guestPhone']}
🗺 <b>Tur:</b> #{booking['tourTitleLocalized'] || booking['tourTitle']}
📅 <b>Sana:</b> #{booking['startDate']} (#{booking['startTime'] || '09:00'})
📍 <b>Olib ketish:</b> #{booking['pickupLocation'] || booking['roomNumber'] || '-'}

📌 <b>Yangi status:</b> <b>#{body['status']}</b>
🕒 <b>Vaqti:</b> #{Time.now.strftime('%H:%M:%S')}"
          send_telegram(tg['botToken'], tg['chatId'], text)
        end

        json_response(res, 200, { success: true, booking: booking })
      else
        json_response(res, 404, { error: "Buyurtma topilmadi" })
      end

    when '/api/tours'
      db = read_db
      tour_data = body
      index = (db['tours'] || []).find_index { |t| t['id'] == tour_data['id'] }
      db['tours'] ||= []
      if index
        db['tours'][index] = tour_data
      else
        db['tours'].push(tour_data)
      end
      write_db(db)
      json_response(res, 200, { success: true, tour: tour_data })

    when '/api/settings'
      db = read_db
      db['settings'] ||= {}
      db['settings'] = db['settings'].merge(body)
      write_db(db)
      json_response(res, 200, { success: true, settings: db['settings'] })

    when '/api/telegram/test'
      token = body['botToken'].to_s.strip
      chat_id = body['chatId'].to_s.strip
      test_msg = "✈️ <b>Aureon Travel Backend</b>\n\nTelegram bot muvaffaqiyatli ulandi! ✅\nSana: #{Time.now.strftime('%Y-%m-%d %H:%M:%S')}"
      ok = send_telegram(token, chat_id, test_msg)
      if ok
        json_response(res, 200, { success: true, message: "Xabar muvaffaqiyatli yuborildi!" })
      else
        json_response(res, 400, { success: false, error: "Telegram botga ulanib bo'lmadi. Token yoki Chat ID ni tekshiring." })
      end

    when '/api/admin/login'
      db = read_db
      correct = (db['settings'] && db['settings']['adminPassword']) || "admin"
      if body['password'] == correct
        json_response(res, 200, { success: true, token: "aureon_session_#{Time.now.to_i}" })
      else
        json_response(res, 401, { success: false, error: "Parol noto'g'ri" })
      end

    else
      json_response(res, 404, { error: "API endpoint topilmadi" })
    end
  end

  def do_PATCH(req, res)
    do_POST(req, res)
  end

  def do_DELETE(req, res)
    set_cors(res)
    path = req.path
    case path
    when %r{^/api/bookings/([^/]+)$}
      b_id = Regexp.last_match(1)
      db = read_db
      db['bookings'] = (db['bookings'] || []).reject { |b| b['id'] == b_id }
      write_db(db)
      json_response(res, 200, { success: true })
    when %r{^/api/tours/([^/]+)$}
      t_id = Regexp.last_match(1)
      db = read_db
      db['tours'] = (db['tours'] || []).reject { |t| t['id'] == t_id }
      write_db(db)
      json_response(res, 200, { success: true })
    else
      json_response(res, 404, { error: "API topilmadi" })
    end
  end
end

server = WEBrick::HTTPServer.new(
  Port: PORT,
  BindAddress: '0.0.0.0',
  AccessLog: [],
  Logger: WEBrick::Log.new($stderr, WEBrick::Log::WARN)
)

server.mount('/', ApiServerServlet)

trap('INT') { server.shutdown }

puts "=================================================="
puts "  ✈️  AUREON TRAVEL REST API & WEB SERVER ISHGA TUSHDI!"
puts "  🚀 Port: #{PORT}"
puts "  👉 Bosh sahifa:   http://localhost:#{PORT}/index.html"
puts "  👉 Bron qilish:   http://localhost:#{PORT}/booking.html"
puts "  👉 Admin panel:   http://localhost:#{PORT}/admin.html"
puts "  👉 API Status:    http://localhost:#{PORT}/api/status"
puts "=================================================="
puts "Serverni to'xtatish uchun: Ctrl + C"

server.start
