from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Разрешаем запросы с фронтенда

# Хранение ответов в памяти (словарь)
answers_store = {}

def check_taxpayer_status(inn):
    """
    Проверяет статус налогоплательщика по ИНН через API nalog.ru
    
    Args:
        inn (str): ИНН (12 цифр)
    
    Returns:
        dict: Результат проверки с полями:
            - status (bool): True если является плательщиком налога на профессиональный доход
            - message (str): Сообщение от API
            - success (bool): Успешно ли выполнен запрос к API
    """
    url = "https://statusnpd.nalog.ru/api/v1/tracker/taxpayer_status"
    
    # Текущая дата в формате yyyy-MM-dd
    request_date = datetime.now().strftime("%Y-%m-%d")
    
    payload = {
        "inn": inn,
        "requestDate": request_date
    }
    print(payload)
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        return {
            "status": data.get("status", False),
            "message": data.get("message", ""),
            "success": True
        }
        
    except requests.exceptions.RequestException as e:
        print(f"Ошибка при запросе к API nalog.ru: {e}")
        return {
            "status": False,
            "message": f"Ошибка при проверке статуса: {str(e)}",
            "success": False
        }
    except ValueError as e:
        print(f"Ошибка парсинга JSON: {e}")
        return {
            "status": False,
            "message": f"Ошибка обработки ответа API: {str(e)}",
            "success": False
        }

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
        taxpayer_status_result = None
        if 'inn' in data:
            inn = data['inn']
            if not isinstance(inn, str) or not inn.isdigit() or len(inn) != 12:
                return jsonify({"error": "ИНН должен состоять из 12 цифр"}), 400
            
            # Проверка статуса налогоплательщика через API
            taxpayer_status_result = check_taxpayer_status(inn)
            print(f"Статус налогоплательщика для ИНН {inn}: {taxpayer_status_result}")
        
        # Генерируем уникальный ID на основе timestamp
        import time
        answer_id = str(int(time.time() * 1000))
        
        # Сохраняем ответы вместе со статусом налогоплательщика
        answers_store[answer_id] = {
            "id": answer_id,
            "timestamp": answer_id,
            "answers": data,
            "taxpayer_status": taxpayer_status_result
        }
        
        # Логируем для отладки
        print(f"Saved answers with ID {answer_id}: {data}")
        
        return jsonify({
            "message": "Ответы успешно сохранены",
            "id": answer_id,
            "taxpayer_status": taxpayer_status_result
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