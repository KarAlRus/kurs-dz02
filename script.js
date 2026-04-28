// Конфигурация
const API_BASE_URL = 'http://localhost:5001';

// DOM элементы
const questionsContainer = document.getElementById('questionsContainer');
const questionnaireForm = document.getElementById('questionnaireForm');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const responseCard = document.getElementById('responseCard');
const newFormBtn = document.getElementById('newFormBtn');
const viewAnswersBtn = document.getElementById('viewAnswersBtn');
const answersModal = document.getElementById('answersModal');
const closeModalBtn = document.querySelector('.close');
const closeModalBtnFooter = document.getElementById('closeModalBtn');
const answersData = document.getElementById('answersData');

// Загрузка вопросов с сервера
async function loadQuestions() {
    try {
        const response = await fetch(`${API_BASE_URL}/questions`);
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        const questions = await response.json();
        renderQuestions(questions);
    } catch (error) {
        console.error('Ошибка загрузки вопросов:', error);
        questionsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                Не удалось загрузить вопросы. Проверьте, запущен ли сервер.
            </div>
            <button onclick="location.reload()" class="btn btn-secondary">
                <i class="fas fa-redo"></i> Попробовать снова
            </button>
        `;
    }
}

// Отображение вопросов в форме
function renderQuestions(questions) {
    questionsContainer.innerHTML = '';
    
    questions.forEach((question, index) => {
        const questionElement = document.createElement('div');
        questionElement.className = 'question-item';
        let hintHtml = '';
        if (question.description) {
            hintHtml = `<div class="hint"><i class="fas fa-info-circle"></i> ${question.description}</div>`;
        }
        questionElement.innerHTML = `
            <label class="question-label ${question.required ? 'required' : ''}">
                <i class="fas fa-question-circle"></i>
                ${question.label}
            </label>
            ${renderQuestionInput(question)}
            ${hintHtml}
        `;
        questionsContainer.appendChild(questionElement);
    });
}

// Генерация HTML для разных типов полей
function renderQuestionInput(question) {
    const { id, type, required, options, min, max, pattern, maxlength, description } = question;
    
    switch (type) {
        case 'text':
            let attrs = '';
            if (pattern) attrs += ` pattern="${pattern}"`;
            if (maxlength) attrs += ` maxlength="${maxlength}"`;
            if (description) attrs += ` title="${description}"`;
            return `<input type="text"
                           id="${id}"
                           name="${id}"
                           class="form-control"
                           ${required ? 'required' : ''}
                           ${attrs}
                           placeholder="Введите ${question.label.toLowerCase()}">`;
        
        case 'number':
            return `<input type="number"
                           id="${id}"
                           name="${id}"
                           class="form-control"
                           ${required ? 'required' : ''}
                           ${min ? `min="${min}"` : ''}
                           ${max ? `max="${max}"` : ''}
                           placeholder="Введите ${question.label.toLowerCase()}">`;
        
        case 'select':
            let optionsHtml = '<option value="" disabled selected>Выберите вариант</option>';
            options.forEach(option => {
                optionsHtml += `<option value="${option}">${option}</option>`;
            });
            return `<select id="${id}" name="${id}" class="form-control" ${required ? 'required' : ''}>
                        ${optionsHtml}
                    </select>`;
        
        default:
            return `<input type="text"
                           id="${id}"
                           name="${id}"
                           class="form-control"
                           ${required ? 'required' : ''}>`;
    }
}

// Отправка формы
async function handleSubmit(event) {
    event.preventDefault();
    
    // Валидация формы
    if (!questionnaireForm.checkValidity()) {
        questionnaireForm.reportValidity();
        return;
    }
    
    // Сбор данных формы
    const formData = new FormData(questionnaireForm);
    const answers = {};
    
    formData.forEach((value, key) => {
        answers[key] = value;
    });
    
    // Показ состояния загрузки
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    submitBtn.disabled = true;
    
    try {
        // Отправка на сервер
        const response = await fetch(`${API_BASE_URL}/answers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(answers)
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Ответ сервера:', result);
        
        // Показ сообщения об успехе
        showSuccessMessage();
        
    } catch (error) {
        console.error('Ошибка отправки:', error);
        alert('Произошла ошибка при отправке анкеты. Пожалуйста, попробуйте снова.');
    } finally {
        // Восстановление кнопки
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Показать сообщение об успешной отправке
function showSuccessMessage() {
    questionnaireForm.style.display = 'none';
    responseCard.style.display = 'block';
    responseCard.scrollIntoView({ behavior: 'smooth' });
}

// Сброс формы
function resetForm() {
    if (confirm('Вы уверены, что хотите очистить все поля формы?')) {
        questionnaireForm.reset();
        // Убираем сообщения об ошибках
        const errorElements = document.querySelectorAll('.error');
        errorElements.forEach(el => el.classList.remove('error'));
    }
}

// Показать форму снова
function showFormAgain() {
    questionnaireForm.style.display = 'block';
    responseCard.style.display = 'none';
    questionnaireForm.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Загрузить и показать сохраненные ответы
async function loadAndShowAnswers() {
    try {
        const response = await fetch(`${API_BASE_URL}/answers`);
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        const answers = await response.json();
        answersData.textContent = JSON.stringify(answers, null, 2);
        answersModal.style.display = 'flex';
    } catch (error) {
        console.error('Ошибка загрузки ответов:', error);
        answersData.textContent = 'Ошибка загрузки данных. Убедитесь, что сервер запущен.';
        answersModal.style.display = 'flex';
    }
}

// Закрыть модальное окно
function closeModal() {
    answersModal.style.display = 'none';
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем вопросы
    loadQuestions();
    
    // Обработчики событий
    questionnaireForm.addEventListener('submit', handleSubmit);
    resetBtn.addEventListener('click', resetForm);
    newFormBtn.addEventListener('click', showFormAgain);
    viewAnswersBtn.addEventListener('click', loadAndShowAnswers);
    
    // Модальное окно
    closeModalBtn.addEventListener('click', closeModal);
    closeModalBtnFooter.addEventListener('click', closeModal);
    
    // Закрытие модального окна при клике вне его
    window.addEventListener('click', (event) => {
        if (event.target === answersModal) {
            closeModal();
        }
    });
    
    // Проверка здоровья сервера при загрузке
    fetch(`${API_BASE_URL}/health`)
        .then(response => {
            if (response.ok) {
                console.log('Сервер работает нормально');
            } else {
                console.warn('Сервер может быть недоступен');
            }
        })
        .catch(error => {
            console.warn('Не удалось подключиться к серверу:', error);
        });
});

// Валидация в реальном времени
document.addEventListener('input', (event) => {
    if (event.target.classList.contains('form-control')) {
        if (event.target.checkValidity()) {
            event.target.classList.remove('error');
        } else {
            event.target.classList.add('error');
        }
    }
});

// Экспорт функций для глобального доступа (для отладки)
window.loadQuestions = loadQuestions;
window.loadAndShowAnswers = loadAndShowAnswers;