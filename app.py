from flask import Flask, render_template, request, jsonify
from openai import OpenAI

app = Flask(__name__)

client = OpenAI(api_key="BURAYA_OPENAI_API_KEY")

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/ilbilgi", methods=["POST"])
def il_bilgi():

    il = request.json["il"]

    cevap = client.responses.create(
        model="gpt-5-mini",
        input=f"{il} ili hakkında kısa bilgi ver. Nüfus, bulunduğu bölge ve önemli özelliklerini yaz."
    )

    return jsonify({"cevap": cevap.output_text})


if __name__ == "__main__":
    app.run(debug=True)