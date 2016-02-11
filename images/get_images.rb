path = File.expand_path "../../", __FILE__
require 'net/http'
require 'json'

WORDS = eval File.read "#{path}/words/english.rb"

API_KEY = "774a7d99cf406a2b80769a1b8897aa89" # flickr API key - take a temporary one from: https://www.flickr.com/services/api/explore/flickr.photos.search (run a query then look at the bottom url)

#IDX = WORDS.index("spin")

WORDS.each_with_index do |word, idx|
  #next if idx <= IDX+1

  # get img url from flickr
  url = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=#{API_KEY}&tags=#{word}&per_page=1&license=1,2&format=json"
  resp = Net::HTTP.get_response URI.parse url
  resp = resp.body[14..-2] # stupid jsonP
  resp = JSON.parse resp
  photo = resp["photos"]["photo"].first
  puts "Error: #{resp}" unless photo
  farm, server, id, secret, owner = photo["farm"], photo["server"], photo["id"], photo["secret"], photo["owner"]

  # information about the authors (to copy into the prgject's Readme)
  puts "CCby: Owner: #{owner} - Word: #{word}"
  puts "link: https://www.flickr.com/photos/#{owner}/#{id}\n\n"

  # download img
  url = "http://c2.staticflickr.com/#{farm}/#{server}/#{id}_#{secret}_q.jpg" # b for nonsquare
  resp = Net::HTTP.get_response URI.parse url
  File.open("#{path}/images/english/#{word}.jpg", 'w:binary'){ |f| f.write resp.body }
end
