from flask import Flask, request, jsonify
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)  # Разрешаем запросы с фронтенда

# Хранение ответов в памяти (словарь)
answers_store = {}

# Список вопросов анкеты
QUESTIONS = [
    {
        "id": "name",
        "label": "Имя",
        "type": "text",
        "required": True
    },
    {
        "id": "gender",
        "label": "Пол",
        "type": "select",
        "options": ["Мужской", "Женский", "Другой"],
        "required": True
    },
    {
        "id": "age",
        "label": "Возраст",
        "type": "number",
        "required": True,
        "min": 1,
        "max": 120
    },
    {
        "id": "position",
        "label": "Должность",
        "type": "text",
        "required": True
    },
    {
        "id": "specialty",
        "label": "Специальность",
        "type": "text",
        "required": True
    },
    {
        "id": "inn",
        "label": "ИНН",
        "type": "text",
        "required": True,
        "pattern": "\\d{12}",
        "maxlength": 12,
        "description": "12 цифр"
    }
]

@app.route('/questions', methods=['GET'])
def get_questions():
    """Возвращает список вопросов анкеты"""
    return jsonify(QUESTIONS)

@app.route('/answers', methods=['POST'])
def save_answers():
    """Принимает ответы пользователя и сохраняет их в памяти"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Валидация ИНН (12 цифр)
        if 'inn' in data:
            inn = data['inn']
            if not isinstance(inn, str) or not inn.isdigit() or len(inn) != 12:
                return jsonify({"error": "ИНН должен состоять из 12 цифр"}), 400
        
        # Генерируем уникальный ID на основе timestamp
        import time
        answer_id = str(int(time.time() * 1000))
        
        # Сохраняем ответы
        answers_store[answer_id] = {
            "id": answer_id,
            "timestamp": answer_id,
            "answers": data
        }
        
        # Логируем для отладки
        print(f"Saved answers with ID {answer_id}: {data}")
        
        return jsonify({
            "message": "Ответы успешно сохранены",
            "id": answer_id
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/answers', methods=['GET'])
def get_all_answers():
    """Возвращает все сохраненные ответы (для отладки)"""
    return jsonify(answers_store)

@app.route('/health', methods=['GET'])
def health_check():
    """Проверка работоспособности сервера"""
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')