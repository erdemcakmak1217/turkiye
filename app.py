from flask import Flask, render_template, request, jsonify
from openai import OpenAI
import os
import requests

app = Flask(__name__)

# OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
# YouTube API key
YOUTUBE_API_KEY =(os.getenv("YOUTUBE_API_KEY"))  # Buraya kendi API key'inizi environment variable olarak ekleyin

@app.route("/")
def index():
    return render_template("index.html")  

@app.route("/il-bilgi", methods=["POST"])
def il_bilgi():
    data = request.json
    il = data.get("il")

    # OpenAI prompt
    prompt = f"""
    {il} Hangi bölgededir? Nüfusu nedir?
    Meşhur yemekleri nelerdir? Nesiyle meşhurdur? Plaka kodu nedir? 

    Kısa cevap ver.
    Format:
    <b><i>{il}</i></b> <br><br> <b>Bölge:</b> ...<br>  <b>Nüfus:</b> ...<br> <b>Meşhur Yemekler:</b> ...<br> <b>Nesiyle Meşhur:</b> ...<br> <b>Plaka Kodu:</b>    ...
    """

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    gpt_cevap = response.choices[0].message.content

    # YouTube API çağrısı
    query = f"{il} gezisi"
    search_url = "https://www.googleapis.com/youtube/v3/search"

    search_params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "order": "viewCount",
        "maxResults": 10,  # biraz fazla çekiyoruz filtre için
        "relevanceLanguage": "tr",
        "key": YOUTUBE_API_KEY
    }

    yt_res = requests.get(search_url, params=search_params)
    yt_data = yt_res.json()

    # video id'leri al
    video_ids = []
    for item in yt_data.get("items", []):
        if item["id"].get("videoId"):
            video_ids.append(item["id"]["videoId"])

    # video detaylarını al (SÜRE İÇİN)
    details_url = "https://www.googleapis.com/youtube/v3/videos"
    details_params = {
        "part": "contentDetails,status",
        "id": ",".join(video_ids),
        "key": YOUTUBE_API_KEY
    }

    details_res = requests.get(details_url, params=details_params)
    details_data = details_res.json()

    # süre filtresi (min 5 dakika)
    import re

    valid_ids = []

    for item in details_data.get("items", []):

        if "contentDetails" not in item:
            continue
        
        if not item.get("status", {}).get("embeddable", False):
            continue
        
        duration = item["contentDetails"]["duration"]

        match = re.search(r'PT(\d+)M', duration)

        if match:
            minutes = int(match.group(1))
            if minutes >= 5:
                valid_ids.append(item["id"])

    # final video listesi
    videos = []

    for item in yt_data.get("items", []):
        video_id = item["id"]["videoId"]

        if video_id in valid_ids:
            videos.append({
                "videoId": video_id,
                "title": item["snippet"]["title"],
                "thumb": item["snippet"]["thumbnails"]["medium"]["url"],
                "url": f"https://www.youtube.com/watch?v={video_id}"
            })

    # max 5 video
    videos = videos[:5]

   
    return jsonify({ "cevap": gpt_cevap, "videolar":videos})

if __name__ == "__main__":
    app.run(debug=True)