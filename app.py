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
    query = f"{il} gezi"  # arama terimi
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "order": "viewCount",
        "maxResults": 5,
        "relevanceLanguage": "tr",
        "key": YOUTUBE_API_KEY
    }
    yt_res = requests.get(url, params=params)
    yt_data = yt_res.json()

    # Videoları filtrele
    videos = []
    for item in yt_data.get("items", []):
        video_id = item["id"]["videoId"]
        title = item["snippet"]["title"]
        thumb = item["snippet"]["thumbnails"]["medium"]["url"]
        videos.append({
            "videoId": video_id,
            "title": title,
            "thumb": thumb,
            "url": f"https://www.youtube.com/watch?v={video_id}"
        })

    return jsonify({"cevap": gpt_cevap, "videolar": videos})

if __name__ == "__main__":
    app.run(debug=True)