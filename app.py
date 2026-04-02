from flask import Flask, render_template, request, jsonify
from openai import OpenAI
import os

app = Flask(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
print(os.getenv("OPENAI_API_KEY"))

@app.route("/")
def index():
    return render_template("index.html")  

@app.route("/il-bilgi", methods=["POST"])
def il_bilgi():
    data = request.json
    il = data.get("il")

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

    return jsonify({"cevap": response.choices[0].message.content})

if __name__ == "__main__":
    app.run(debug=True)