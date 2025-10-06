// DOMセレクタヘルパー
const $ = id => document.getElementById(id);

// ローカルストレージキー
const STORAGE_KEY = 'challengeCoinDataV2';

/**
 * データをロードする
 * @returns {object} ロードされたデータ
 */
function loadData() {
    const dataString = localStorage.getItem(STORAGE_KEY);
    if (dataString) {
        try {
            const data = JSON.parse(dataString);
            
            // データの初期構造チェックとマイグレーション（あれば）
            if (!data.globalSettings) {
                data.globalSettings = { newAccountName: '新しいアカウント', exchangeRate: 10 };
            }
            if (!data.accounts) {
                data.accounts = [];
            }
            
            return data;
        } catch (e) {
            console.error("Error parsing stored data:", e);
            // パースエラー時は初期値を返す
            return initializeDataStructure();
        }
    }
    return initializeDataStructure();
}

/**
 * データ構造の初期値を返す
 * @returns {object} 初期データ構造
 */
function initializeDataStructure() {
    return {
        globalSettings: {
            newAccountName: '新しいアカウント',
            exchangeRate: 10
        },
        accounts: []
    };
}

/**
 * データを保存する
 * @param {object} data 保存するデータ
 */
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 画面遷移ヘルパー
/**
 * 画面を切り替える
 * @param {string} showScreenId 表示する画面のDOM ID
 */
function switchScreen(showScreenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    $(showScreenId).classList.add('active');
}

/**
 * モーダルを表示する
 * @param {string} modalId 表示するモーダルのDOM ID
 */
function showModal(modalId) {
    $(modalId).classList.add('visible');
}

/**
 * モーダルを非表示にする
 * @param {string} modalId 非表示にするモーダルのDOM ID
 */
function hideModal(modalId) {
    $(modalId).classList.remove('visible');
}