# server.rb - Aureon Travel yengil HTTP server
# Ishga tushirish uchun: ruby server.rb

require 'webrick'

root = File.expand_path(File.dirname(__FILE__))
port = 3000

server = WEBrick::HTTPServer.new(
  Port: port,
  DocumentRoot: root,
  AccessLog: [],
  Logger: WEBrick::Log.new($stderr, WEBrick::Log::INFO)
)

trap('INT') { server.shutdown }

puts "=================================================="
puts "  ✈️  AUREON TRAVEL SAYT TIZIMI ISHGA TUSHDI!"
puts "=================================================="
puts "👉 Mexmonlar sayti:  http://localhost:#{port}/index.html"
puts "👉 Admin boshqaruv:  http://localhost:#{port}/admin.html"
puts "=================================================="
puts "Serverni to'xtatish uchun: Ctrl + C"

server.start
