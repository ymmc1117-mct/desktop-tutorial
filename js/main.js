// utils.jsから$、loadData、saveData、switchScreen、showModal、hideModalを利用

let appData = loadData();
let currentAccountIndex = -1;
let currentChallengeIndex = 0; // 既存コードのロジックを維持
let confirmCallback = null;

/**
 * アカウントデータ構造の初期値
 * @param {string} name アカウント名
 * @returns {object}
 */
const initialAccount = (name) => ({
    name: name,
    coin: 0,
    challenges: [
        'お手伝いをする', 
        '早寝早起きをする',
        '宿題を終わらせる'
    ],
    history: []
});

/**
 * アカウント選択画面のレンダリング
 */
function renderAccountSelectScreen() {
    switchScreen('accountSelectScreen');
    const accountList = $('accountList');
    accountList.innerHTML = '';
    
    appData.accounts.forEach((account, index) => {
        const card = document.createElement('div');
        card.className = 'account-card';
        card.setAttribute('data-index', index);
        card.innerHTML = `
            <h3>${account.name}</h3>
            <p>${account.coin}</p>
        `;
        card.onclick = () => selectAccount(index);
        accountList.appendChild(card);
    });

    // グローバル設定の値を更新
    $('newAccountName').value = appData.globalSettings.newAccountName;
    $('exchangeRate').value = appData.globalSettings.exchangeRate;
}

/**
 * アカウントを選択し、コイン画面へ遷移
 * @param {number} index 選択されたアカウントのインデックス
 */
function selectAccount(index) {
    currentAccountIndex = index;
    renderCoinScreen();
}

/**
 * コイン管理画面のレンダリング
 */
function renderCoinScreen() {
    if (currentAccountIndex === -1) return;

    switchScreen('coinScreen');
    const account = appData.accounts[currentAccountIndex];

    // タイトルとコイン数
    $('accountNameTitle').textContent = account.name;
    $('currentCoinCount').textContent = account.coin;

    // チャレンジリスト
    const challengeList = $('challengeList');
    challengeList.innerHTML = '';
    account.challenges.forEach((challenge, index) => {
        const li = document.createElement('li');
        li.textContent = challenge;
        challengeList.appendChild(li);
    });
    
    // 履歴リスト
    renderHistoryDetails();
}

/**
 * 履歴詳細のレンダリング
 */
function renderHistoryDetails() {
    const account = appData.accounts[currentAccountIndex];
    const coinHistory = $('coinHistory');
    coinHistory.innerHTML = '';
    
    // 最新の履歴から表示 (最大20件など制限を設けるのがベストだが、既存コード模倣のため全件表示)
    account.history.slice().reverse().forEach(item => {
        const li = document.createElement('li');
        const actionClass = item.action.toLowerCase();
        
        li.innerHTML = `
            <span>${item.date}</span>
            <span class="history-action ${actionClass}">${item.action} (${item.amount > 0 ? '+' : ''}${item.amount})</span>
        `;
        coinHistory.appendChild(li);
    });
}

/**
 * コインの加算/減算/交換処理
 * @param {number} amount コインの増減量
 * @param {string} action アクションタイプ ('ADD', 'REMOVE', 'EXCHANGE')
 */
function updateCoin(amount, action) {
    const account = appData.accounts[currentAccountIndex];
    
    if (account.coin + amount < 0) {
        alert('コインが不足しています！');
        return;
    }

    account.coin += amount;
    
    // 履歴に追加
    const date = new Date().toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' });
    account.history.push({ date: date, amount: amount, action: action });
    
    saveData(appData);
    renderCoinScreen();
}

// === グローバル設定モーダル関連 ===

function showGlobalSettingsModal() {
    showModal('globalSettingsModal');
}

function hideGlobalSettingsModal() {
    hideModal('globalSettingsModal');
}

function saveGlobalSettings() {
    const newAccountName = $('newAccountName').value.trim();
    const exchangeRate = parseInt($('exchangeRate').value);

    if (newAccountName) {
        appData.globalSettings.newAccountName = newAccountName;
    }
    if (!isNaN(exchangeRate) && exchangeRate >= 1) {
        appData.globalSettings.exchangeRate = exchangeRate;
    }

    saveData(appData);
    hideGlobalSettingsModal();
}

function resetAllDataConfirm() {
    showConfirmModal(
        '本当に**全アカウントのデータ**をリセットしますか？この操作は元に戻せません。', 
        () => {
            resetAllData();
            hideConfirmModal();
        }
    );
}

function resetAllData() {
    localStorage.removeItem('challengeCoinDataV2'); // 新しいキーを使用
    window.location.reload();
}


// === 詳細設定モーダル関連 ===

function showDetailSettingsModal() {
    if (currentAccountIndex === -1) return;
    const account = appData.accounts[currentAccountIndex];
    
    $('detailModalAccountName').textContent = `${account.name} の設定`;
    
    // チャレンジリストの編集用レンダリング
    renderEditableChallenges();
    
    showModal('detailSettingsModal');
}

function hideDetailSettingsModal() {
    hideModal('detailSettingsModal');
}

function renderEditableChallenges() {
    const account = appData.accounts[currentAccountIndex];
    const list = $('editableChallengeList');
    list.innerHTML = '';
    
    account.challenges.forEach((challenge, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${challenge}</span>
            <button class="delete-challenge-btn" data-index="${index}">削除</button>
        `;
        list.appendChild(li);
        
        // 削除ボタンのイベントリスナー
        li.querySelector('.delete-challenge-btn').onclick = (e) => {
            const indexToDelete = parseInt(e.target.getAttribute('data-index'));
            removeChallenge(indexToDelete);
        };
    });
}

function addChallenge() {
    const challengeTitle = $('challengeTitle').value.trim();
    if (challengeTitle && currentAccountIndex !== -1) {
        appData.accounts[currentAccountIndex].challenges.push(challengeTitle);
        $('challengeTitle').value = ''; // 入力欄をクリア
        renderEditableChallenges(); // リストを再レンダリング
        // 保存はまとめてsaveDetailSettingsで行う
    }
}

function removeChallenge(index) {
    if (currentAccountIndex !== -1) {
        appData.accounts[currentAccountIndex].challenges.splice(index, 1);
        renderEditableChallenges(); // リストを再レンダリング
        // 保存はまとめてsaveDetailSettingsで行う
    }
}

function saveDetailSettings() {
    // チャレンジの追加/削除はすでに行われているため、ここではデータを保存するだけ
    saveData(appData);
    renderCoinScreen(); // コイン画面のチャレンジリストを更新
    hideDetailSettingsModal();
}

function resetCurrentAccountConfirm() {
    showConfirmModal(
        `本当に**${appData.accounts[currentAccountIndex].name}**のコインと履歴をリセットしますか？`,
        () => {
            resetCurrentAccount();
            hideConfirmModal();
        }
    );
}

function resetCurrentAccount() {
    const account = appData.accounts[currentAccountIndex];
    account.coin = 0;
    account.history = [];
    saveData(appData);
    renderCoinScreen();
}


// === 確認モーダル関連 ===

function showConfirmModal(message, callback) {
    $('confirmMessage').innerHTML = message;
    confirmCallback = callback;
    showModal('confirmModal');
}

function hideConfirmModal() {
    confirmCallback = null;
    hideModal('confirmModal');
}

function showExchangeConfirm() {
    const account = appData.accounts[currentAccountIndex];
    const rate = appData.globalSettings.exchangeRate;
    
    if (account.coin < rate) {
        alert(`コインが交換レート（${rate}）に達していません！`);
        return;
    }
    
    showConfirmModal(
        `現在の**${account.coin}**コインを、交換レート**${rate}**で交換しますか？<br>交換すると、**${account.coin}**コインが減ります。`,
        () => {
            updateCoin(-account.coin, 'EXCHANGE');
            hideConfirmModal();
        }
    );
}


// === イベントリスナー ===

// アカウント選択画面
$('globalSettingsBtn').onclick = showGlobalSettingsModal;
$('addAccountBtn').onclick = () => {
    const newName = appData.globalSettings.newAccountName;
    appData.accounts.push(initialAccount(newName));
    saveData(appData);
    renderAccountSelectScreen();
};

// コイン管理画面
$('backBtn').onclick = () => {
    currentAccountIndex = -1;
    renderAccountSelectScreen();
};
$('detailSettingsBtn').onclick = showDetailSettingsModal;
$('addCoinBtn').onclick = () => updateCoin(1, 'ADD');
$('removeCoinBtn').onclick = () => updateCoin(-1, 'REMOVE');
$('exchangeBtn').onclick = showExchangeConfirm;
$('toggleHistoryBtn').onclick = () => {
    const historyDetails = $('historyDetails');
    const isHidden = historyDetails.classList.toggle('hidden');
    $('toggleHistoryBtn').textContent = isHidden ? '履歴を見る ▼' : '履歴を隠す ▲';
};


// グローバル設定モーダル
$('closeGlobalSettingsBtn').onclick = hideGlobalSettingsModal;
$('saveGlobalSettingsBtn').onclick = saveGlobalSettings;
$('resetAllBtn').onclick = resetAllDataConfirm;

// 詳細設定モーダル
$('closeDetailSettingsBtn').onclick = hideDetailSettingsModal;
$('addChallengeInDetailModalBtn').onclick = addChallenge;
$('saveDetailSettingsBtn').onclick = saveDetailSettings;
$('resetCurrentBtn').onclick = resetCurrentAccountConfirm;

// 確認モーダル
$('confirmActionBtn').onclick = () => {
    if (confirmCallback) {
        confirmCallback();
        // callback内でhideConfirmModalを呼ぶように修正 (例: resetAllDataConfirm)
        // またはここで強制的に非表示にしても良いが、callbackの制御に委ねる
    } else {
         hideConfirmModal();
    }
};
$('cancelBtn').onclick = hideConfirmModal;
    
// 初期化
document.addEventListener('DOMContentLoaded', () => {
    renderAccountSelectScreen();
});