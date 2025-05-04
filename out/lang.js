"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.t = void 0;
// lang.ts — багатомовність для Redmine by DeVylM + Activity ID
const vscode = __importStar(require("vscode"));
const translations = {
    en: {
        startTracking: '▶️ Start Tracking',
        stopTracking: '⏹ Stop Tracking',
        setIssue: '📝 Set Active Issue',
        setIssuePrompt: 'Enter Redmine Issue ID',
        setIssueConfirm: 'Active issue set to',
        enterTime: '⏱ Enter Manual Time',
        enterTimePrompt: 'Enter time (e.g. 1.5 for 1 hour 30 mins)',
        manualTimeSet: 'Manual time set:',
        sendTime: '📤 Send Time to Redmine',
        timeSent: 'Time entry sent',
        sendError: 'Failed to send time. Status:',
        requestError: 'Request error:',
        noIssue: 'No active issue',
        tooltip: 'Click to open action menu',
        placeholder: 'What do you want to do?',
        fetchingIssues: 'Fetching issues...',
        noIssuesFound: 'No issues found.',
        chooseIssue: 'Choose an issue to track',
        chooseActivity: 'Choose activity for time entry',
        setActivity: '⚙️ Set Activity ID',
        activitySet: 'Activity set to:',
        autoStoppedDueToInactivity: 'Tracking stopped due to inactivity',
        sendTimeAndChangeStatus: '📤 Send time and change status',
        chooseStatus: 'Select a new issue status',
        statusUpdated: 'Status updated:',
        statusUpdateFailed: 'Failed to update status. Code:',
        noStatusesFound: 'No issue statuses found',
        autoStartedDueToEdit: 'Tracking started automatically after file edit',
        missingRequiredConfiguration: 'Missing required configuration. Please check the settings of Redmine by DeVylM extension',
    },
    uk: {
        startTracking: '▶️ Почати трекінг',
        stopTracking: '⏹ Зупинити трекінг',
        setIssue: '📝 Встановити активну задачу',
        setIssuePrompt: 'Введи ID задачі Redmine',
        setIssueConfirm: 'Задача встановлена як активна:',
        enterTime: '⏱ Вказати час вручну',
        enterTimePrompt: 'Введи час (наприклад, 1.5 = 1 год 30 хв)',
        manualTimeSet: 'Встановлено час вручну:',
        sendTime: '📤 Відправити час у Redmine',
        timeSent: 'Час надіслано',
        sendError: 'Помилка відправки часу. Статус:',
        requestError: 'Помилка запиту:',
        noIssue: 'Немає активної задачі',
        tooltip: 'Клікни для меню дій',
        placeholder: 'Що бажаєш зробити?',
        fetchingIssues: 'Завантаження задач...',
        noIssuesFound: 'Задач не знайдено.',
        chooseIssue: 'Вибери задачу для трекінгу',
        chooseActivity: 'Вибери активність для обліку часу',
        setActivity: '⚙️ Встановити Activity ID',
        activitySet: 'Активність встановлена:',
        autoStoppedDueToInactivity: 'Трекінг зупинено через бездіяльність',
        sendTimeAndChangeStatus: '📤 Відправити час і змінити статус',
        chooseStatus: 'Оберіть новий статус задачі',
        statusUpdated: 'Статус оновлено:',
        statusUpdateFailed: 'Не вдалося змінити статус. Код:',
        noStatusesFound: 'Статуси задач не знайдені',
        autoStartedDueToEdit: 'Трекінг автоматично запущено після зміни у файлі',
        missingRequiredConfiguration: "Відсутня обов'язкова конфігурація. Будь ласка, перевірте налаштування розширення Redmine by DeVylM",
    },
    ru: {
        startTracking: '▶️ Начать трекинг',
        stopTracking: '⏹ Остановить трекинг',
        setIssue: '📝 Установить активную задачу',
        setIssuePrompt: 'Введите ID задачи Redmine',
        setIssueConfirm: 'Активная задача установлена:',
        enterTime: '⏱ Ввести время вручную',
        enterTimePrompt: 'Введите время (например, 1.5 = 1 час 30 минут)',
        manualTimeSet: 'Время вручную установлено:',
        sendTime: '📤 Отправить время в Redmine',
        timeSent: 'Время успешно отправлено',
        sendError: 'Ошибка отправки времени. Статус:',
        requestError: 'Ошибка запроса:',
        noIssue: 'Нет активной задачи',
        tooltip: 'Кликните для меню действий',
        placeholder: 'Что вы хотите сделать?',
        fetchingIssues: 'Загрузка задач...',
        noIssuesFound: 'Задачи не найдены.',
        chooseIssue: 'Выберите задачу для отслеживания',
        chooseActivity: 'Выберите активность для учета времени',
        setActivity: '⚙️ Установить Activity ID',
        activitySet: 'Активность установлена:',
        autoStoppedDueToInactivity: 'Отслеживание остановлено из-за бездействия',
        sendTimeAndChangeStatus: '📤 Отправить время и изменить статус',
        chooseStatus: 'Выберите новый статус задачи',
        statusUpdated: 'Статус обновлён:',
        statusUpdateFailed: 'Не удалось обновить статус. Код:',
        noStatusesFound: 'Статусы задач не найдены',
        autoStartedDueToEdit: 'Отслеживание автоматически запущено после изменения файла',
        missingRequiredConfiguration: 'Отсутствует обязательная конфигурация. Пожалуйста, проверьте настройки расширения Redmine by DeVylM',
    },
    pl: {
        startTracking: '▶️ Rozpocznij śledzenie',
        stopTracking: '⏹ Zatrzymaj śledzenie',
        setIssue: '📝 Ustaw aktywne zadanie',
        setIssuePrompt: 'Wpisz ID zadania Redmine',
        setIssueConfirm: 'Ustawiono aktywne zadanie:',
        enterTime: '⏱ Wprowadź czas ręcznie',
        enterTimePrompt: 'Wpisz czas (np. 1.5 = 1 godzina 30 minut)',
        manualTimeSet: 'Ustawiono ręczny czas:',
        sendTime: '📤 Wyślij czas do Redmine',
        timeSent: 'Czas wysłany',
        sendError: 'Błąd wysyłania czasu. Status:',
        requestError: 'Błąd żądania:',
        noIssue: 'Brak aktywnego zadania',
        tooltip: 'Kliknij, aby otworzyć menu',
        placeholder: 'Co chcesz zrobić?',
        fetchingIssues: 'Pobieranie zadań...',
        noIssuesFound: 'Nie znaleziono zadań.',
        chooseIssue: 'Wybierz zadanie do śledzenia',
        chooseActivity: 'Wybierz aktywność do rejestru czasu',
        setActivity: '⚙️ Ustaw ID aktywności',
        activitySet: 'Aktywność ustawiona:',
        autoStoppedDueToInactivity: 'Śledzenie zatrzymane z powodu braku aktywności',
        sendTimeAndChangeStatus: '📤 Wyślij czas i zmień status',
        chooseStatus: 'Wybierz nowy status zadania',
        statusUpdated: 'Status zaktualizowany:',
        statusUpdateFailed: 'Nie udało się zaktualizować statusu. Kod:',
        noStatusesFound: 'Nie znaleziono statusów zadań',
        autoStartedDueToEdit: 'Śledzenie rozpoczęte automatycznie po edycji pliku',
        missingRequiredConfiguration: 'Brak wymaganej konfiguracji. Proszę sprawdzić ustawienia rozszerzenia Redmine by DeVylM',
    },
};
const lang = vscode?.env?.language?.substring(0, 2) || 'en';
function t(key) {
    return translations[lang]?.[key] || translations['en'][key] || key;
}
exports.t = t;
