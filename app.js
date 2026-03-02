// ================================
// 引入 API Client
// ================================
// 注意：静态版本不使用 API，数据存储在 localStorage

// ================================
// 模拟数据
// ================================

// 选手数据（4 人制，但保留扩展性）
let players = [
    { id: 1, name: '龙鑫昊', avatar: '龙', points: 0, wins: 0, losses: 0, draws: 0, signature: '羽球狂人', play_type: 'both' },
    { id: 2, name: '黄玮', avatar: '黄', points: 0, wins: 0, losses: 0, draws: 0, signature: '扣杀之王', play_type: 'both' },
    { id: 3, name: '许力群', avatar: '许', points: 0, wins: 0, losses: 0, draws: 0, signature: '防守大师', play_type: 'both' },
    { id: 4, name: '林智鑫', avatar: '林', points: 0, wins: 0, losses: 0, draws: 0, signature: '网前小球', play_type: 'both' },
];

// 双打组合数据
let doublesTeams = [
    { id: 1, name: '龙鑫昊/黄玮', players: [1, 2], points: 0, wins: 0, losses: 0, draws: 0 },
    { id: 2, name: '许力群/林智鑫', players: [3, 4], points: 0, wins: 0, losses: 0, draws: 0 },
];

// 比赛记录
let matchHistory = [];

// 日历状态
let currentCalendarDate = new Date();
let selectedCalendarDate = null;

// ================================
// 数据加载（从 data.json 加载）
// ================================

// 加载数据
async function loadLocalData() {
    // 先从 localStorage 加载
    const savedPlayers = localStorage.getItem('badminton_players');
    const savedDoubles = localStorage.getItem('badminton_doubles');
    const savedMatches = localStorage.getItem('badminton_matches');
    const savedNextId = localStorage.getItem('badminton_nextPlayerId');

    if (savedPlayers) players = JSON.parse(savedPlayers);
    if (savedDoubles) doublesTeams = JSON.parse(savedDoubles);
    if (savedMatches) matchHistory = JSON.parse(savedMatches);
    if (savedNextId) window.nextPlayerId = parseInt(savedNextId);

    console.log('从 localStorage 加载数据:', players.length, '名选手');

    // 尝试从 GitHub 加载最新数据（无需 token）
    await loadFromGithub();

    // 初始化缺失的 draws 字段（兼容性处理）
    players.forEach(p => {
        if (typeof p.draws === 'undefined') p.draws = 0;
    });
    doublesTeams.forEach(t => {
        if (typeof t.draws === 'undefined') t.draws = 0;
    });

    console.log('数据加载完成');
}

// 从 GitHub 加载最新数据
async function loadFromGithub() {
    try {
        const owner = localStorage.getItem('github_owner') || 'Orange-Long320';
        const repo = localStorage.getItem('github_repo') || 'badminton';
        const branch = localStorage.getItem('github_branch') || 'gh-pages';

        if (!owner || !repo || !branch) {
            return;
        }

        const timestamp = Date.now();
        const response = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/data.json?t=${timestamp}`);

        if (!response.ok) {
            console.log('从 GitHub 加载失败：HTTP', response.status);
            return;
        }

        const data = await response.json();
        console.log('从 GitHub 加载的原始数据:', {
            players: data.players?.length,
            doublesTeams: (data.doublesTeams || data.doubles)?.length,
            matches: data.matches?.length
        });

        // 只有在 GitHub 数据存在时才更新
        if (data.players && data.players.length > 0) {
            players = data.players;
            localStorage.setItem('badminton_players', JSON.stringify(players));
        }
        if (data.doublesTeams || data.doubles) {
            doublesTeams = data.doublesTeams || data.doubles;
            localStorage.setItem('badminton_doubles', JSON.stringify(doublesTeams));
        }
        if (data.matches && data.matches.length > 0) {
            matchHistory = data.matches;
            localStorage.setItem('badminton_matches', JSON.stringify(matchHistory));
        }
        if (data.nextPlayerId) {
            window.nextPlayerId = data.nextPlayerId;
            localStorage.setItem('badminton_nextPlayerId', data.nextPlayerId.toString());
        }

        console.log('已从 GitHub 同步最新数据');
        console.log('同步后双打组合数量:', doublesTeams.length);
        console.log('同步后比赛记录数量:', matchHistory.length);

        // 同步数据后重新计算统计数据
        recalculateDoublesStats();
        console.log('重新计算后双打组合数据:', doublesTeams);
    } catch (e) {
        console.warn('从 GitHub 加载失败:', e.message);
    }
}

// 使用内置默认数据
function useDefaultData() {
    players = [
        { id: 1, name: '龙鑫昊', avatar: '龙', points: 9, wins: 1, losses: 1, draws: 2, signature: '羽球狂人', play_type: 'both' },
        { id: 2, name: '黄玮', avatar: '黄', points: 10, wins: 2, losses: 1, draws: 1, signature: '扣杀之王', play_type: 'both' },
        { id: 3, name: '许力群', avatar: '许', points: 7, wins: 1, losses: 1, draws: 2, signature: '防守大师', play_type: 'both' },
        { id: 4, name: '林智鑫', avatar: '林', points: 4, wins: 1, losses: 2, draws: 1, signature: '网前小球', play_type: 'both' },
    ];
    doublesTeams = [
        { id: 1, name: '龙鑫昊/黄玮', players: [1, 2], points: 0, wins: 0, losses: 0, draws: 0 },
        { id: 2, name: '许力群/林智鑫', players: [3, 4], points: 0, wins: 0, losses: 0, draws: 0 },
        { id: 3, name: '龙鑫昊/许力群', players: [1, 3], points: 6, wins: 0, losses: 0, draws: 1 },
        { id: 4, name: '黄玮/林智鑫', players: [2, 4], points: 6, wins: 0, losses: 0, draws: 1 },
    ];
    matchHistory = [
        { id: 7, type: 'doubles', team1: '龙鑫昊/许力群', team2: '黄玮/林智鑫', score: '6:6', winner: 'draw', date: '2026-03-01' },
        { id: 7, type: 'singles', team1: '黄玮', team2: '林智鑫', score: '3:0', winner: 'team1', date: '2026-03-01' },
        { id: 5, type: 'singles', team1: '林智鑫', team2: '许力群', score: '1:0', winner: 'team1', date: '2026-03-01' },
        { id: 4, type: 'singles', team1: '黄玮', team2: '许力群', score: '0:1', winner: 'team2', date: '2026-03-01' },
        { id: 3, type: 'singles', team1: '龙鑫昊', team2: '林智鑫', score: '2:0', winner: 'team1', date: '2026-03-01' },
        { id: 2, type: 'singles', team1: '龙鑫昊', team2: '许力群', score: '1:1', winner: 'draw', date: '2026-03-01' },
        { id: 1, type: 'singles', team1: '龙鑫昊', team2: '黄玮', score: '0:1', winner: 'team2', date: '2026-03-01' }
    ];
    window.nextPlayerId = 5;
    console.log('已使用内置默认数据');
}

// 保存数据到本地（仅保存到 localStorage，供管理员导出）
function saveLocalData() {
    localStorage.setItem('badminton_players', JSON.stringify(players));
    localStorage.setItem('badminton_doubles', JSON.stringify(doublesTeams));
    localStorage.setItem('badminton_matches', JSON.stringify(matchHistory));
    localStorage.setItem('badminton_nextPlayerId', (window.nextPlayerId || 5).toString());
}

// 重置数据
function resetAllData() {
    if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
        localStorage.clear();
        location.reload();
    }
}

// 根据比赛记录重新计算双打组合数据和选手数据
function recalculateDoublesStats() {
    // 重置所有双打组合的统计数据
    doublesTeams.forEach(team => {
        team.points = 0;
        team.wins = 0;
        team.losses = 0;
        team.draws = 0;
    });

    // 重置所有选手的统计数据
    players.forEach(player => {
        player.points = 0;
        player.wins = 0;
        player.losses = 0;
        player.draws = 0;
    });

    // 遍历所有比赛记录，重新计算
    matchHistory.forEach(match => {
        const scores = match.score.split(':');
        const team1Score = parseInt(scores[0]) || 0;
        const team2Score = parseInt(scores[1]) || 0;

        if (match.type === 'singles') {
            // 单打比赛
            const player1 = players.find(p => p.name === match.team1);
            const player2 = players.find(p => p.name === match.team2);

            if (player1 && player2) {
                // 计算净胜分
                const netWins = team1Score - team2Score;
                player1.points += netWins;
                player2.points -= netWins;

                // 按小分记录胜/负/平
                player1.wins += team1Score;
                player1.losses += team2Score;
                player2.wins += team2Score;
                player2.losses += team1Score;
            }
        } else {
            // 双打比赛
            const team1Names = match.team1.split('/').sort();
            const team2Names = match.team2.split('/').sort();

            // 找到对应的双打组合
            const doublesTeam1 = doublesTeams.find(t => {
                const teamNames = t.players.map(id => players.find(p => p.id === id)?.name).sort();
                return teamNames[0] === team1Names[0] && teamNames[1] === team1Names[1];
            });

            const doublesTeam2 = doublesTeams.find(t => {
                const teamNames = t.players.map(id => players.find(p => p.id === id)?.name).sort();
                return teamNames[0] === team2Names[0] && teamNames[1] === team2Names[1];
            });

            if (doublesTeam1 && doublesTeam2) {
                // 计算净胜分
                const netWins = team1Score - team2Score;
                doublesTeam1.points += netWins;
                doublesTeam2.points -= netWins;

                // 按小分记录胜/负/平
                doublesTeam1.wins += team1Score;
                doublesTeam1.losses += team2Score;
                doublesTeam2.wins += team2Score;
                doublesTeam2.losses += team1Score;
            } else {
                console.log('未找到双打组合:', match.team1, 'vs', match.team2);
            }
        }
    });

    // 保存重新计算后的数据
    saveLocalData();
    console.log('双打和选手数据已重新计算');
    console.log('双打组合数据:', doublesTeams);
    console.log('比赛记录:', matchHistory);
}

// ================================
// 工具函数
// ================================

// 生成头像 HTML（支持 Base64 图片和文字头像）
function getAvatarHtml(avatar, size = 'normal') {
    if (!avatar) return '<div class="player-avatar">?</div>';

    const sizes = {
        small: { width: 40, height: 40, fontSize: '1.1rem' },
        normal: { width: 48, height: 48, fontSize: '1.25rem' },
        large: { width: 80, height: 80, fontSize: '2.5rem' }
    };
    const s = sizes[size] || sizes.normal;

    // 检查是否是 Base64 图片
    if (avatar.startsWith('data:image')) {
        return `<img src="${avatar}" alt="avatar" style="width:${s.width}px;height:${s.height}px;border-radius:50%;object-fit:cover;">`;
    }
    // 文字头像
    return `<div class="player-avatar" style="width:${s.width}px;height:${s.height}px;font-size:${s.fontSize};">${avatar}</div>`;
}

// 计算胜率（用于显示）
function calculateWinRate(points, totalGames) {
    if (totalGames === 0) return 0;
    return ((points / totalGames) * 100).toFixed(1);
}

// 获取选手积分
function getPlayerPoints(player) {
    return player.points || 0;
}

// 生成排名 HTML
function getRankHtml(rank) {
    const rankClass = rank <= 3 ? `rank rank-${rank}` : 'rank';
    const icons = ['1', '2', '3'];
    if (rank <= 3) {
        return `<span class="${rankClass}">${icons[rank - 1]}</span>`;
    }
    return `<span class="${rankClass}">#${rank}</span>`;
}

// ================================
// 轮播状态
// ================================
let currentPlayerIndex = 0;

// ================================
// 渲染函数
// ================================

// 渲染单打排行榜
function renderSinglesLeaderboard() {
    const tbody = document.getElementById('singles-body');
    const sorted = [...players].sort((a, b) => {
        return b.points - a.points;
    });

    tbody.innerHTML = sorted.map((player, index) => {
        const pointsClass = player.points > 0 ? 'positive' : (player.points < 0 ? 'negative' : '');
        const pointsDisplay = player.points > 0 ? `+${player.points}` : player.points;
        return `
            <tr class="clickable-row" onclick="window.location.href='player.html?playerId=${player.id}'">
                <td>${getRankHtml(index + 1)}</td>
                <td>
                    <div class="player-cell">
                        ${getAvatarHtml(player.avatar)}
                        <span class="player-name player-name-link">${player.name}</span>
                    </div>
                </td>
                <td>
                    <div class="stats-detail">
                        <span class="win-loss">${player.wins}胜${player.losses}负${player.draws > 0 ? `/${player.draws}平` : ''}</span>
                        <span class="points ${pointsClass}">${pointsDisplay}</span>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// 渲染双打排行榜
function renderDoublesLeaderboard() {
    const tbody = document.getElementById('doubles-body');
    const sorted = [...doublesTeams].sort((a, b) => {
        return b.points - a.points;
    });

    tbody.innerHTML = sorted.map((team, index) => {
        const pointsClass = team.points > 0 ? 'positive' : (team.points < 0 ? 'negative' : '');
        const pointsDisplay = team.points > 0 ? `+${team.points}` : team.points;
        return `
            <tr>
                <td>${getRankHtml(index + 1)}</td>
                <td>
                    <div class="player-cell">
                        <span class="player-name">${team.name}</span>
                    </div>
                </td>
                <td>
                    <div class="stats-detail">
                        <span class="win-loss">${team.wins || 0}胜${team.losses || 0}负${(team.draws || 0) > 0 ? `/${team.draws}平` : ''}</span>
                        <span class="points ${pointsClass}">${pointsDisplay}</span>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// 渲染选手轮播卡片
function renderPlayerCarousel() {
    const container = document.getElementById('player-card');
    const dotsContainer = document.getElementById('carousel-dots');
    const player = players[currentPlayerIndex];
    const points = player.points || 0;
    const pointsClass = points > 0 ? 'positive' : (points < 0 ? 'negative' : '');
    const pointsDisplay = points > 0 ? `+${points}` : points;

    container.innerHTML = `
        ${getAvatarHtml(player.avatar, 'large')}
        <div class="player-info">
            <div class="player-name">${player.name}</div>
            <div class="player-stats">
                <div class="stat-item">
                    <span class="stat-value ${pointsClass}">${pointsDisplay}</span>
                    <span class="stat-label">积分</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${player.wins}</span>
                    <span class="stat-label">胜</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${player.losses}</span>
                    <span class="stat-label">负</span>
                </div>
            </div>
        </div>
    `;

    // 绑定查看详情按钮事件
    const viewProfileBtn = document.getElementById('btn-view-profile');
    if (viewProfileBtn) {
        viewProfileBtn.onclick = () => {
            window.location.href = `player.html?playerId=${player.id}`;
        };
    }

    // 渲染指示点
    dotsContainer.innerHTML = players.map((_, index) => `
        <span class="carousel-dot ${index === currentPlayerIndex ? 'active' : ''}"
              data-index="${index}"></span>
    `).join('');

    // 绑定指示点点击事件
    dotsContainer.querySelectorAll('.carousel-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            currentPlayerIndex = parseInt(e.target.dataset.index);
            renderPlayerCarousel();
        });
    });
}

// 切换选手
function switchPlayer(direction) {
    currentPlayerIndex += direction;
    if (currentPlayerIndex < 0) {
        currentPlayerIndex = players.length - 1;
    } else if (currentPlayerIndex >= players.length) {
        currentPlayerIndex = 0;
    }
    renderPlayerCarousel();
}

// 渲染最近比赛
let batchMode = false;
let selectedMatches = new Set();

function renderMatchHistory() {
    const container = document.querySelector('.match-list');
    const recentMatches = matchHistory.slice(0, 5);

    container.innerHTML = recentMatches.map((match, index) => {
        const winner = match.winner === 'team1' ? match.team1 : (match.winner === 'team2' ? match.team2 : '平局');
        const isChecked = selectedMatches.has(match.id);
        return `
            <div class="match-item ${isChecked ? 'selected' : ''}" data-match-id="${match.id}">
                <div class="match-teams">
                    <label class="match-checkbox" style="display: ${batchMode ? 'flex' : 'none'}">
                        <input type="checkbox" ${isChecked ? 'checked' : ''} data-match-id="${match.id}">
                    </label>
                    <span>${match.team1}</span>
                    <span class="match-score">${match.score}</span>
                    <span>${match.team2}</span>
                </div>
                <div class="match-actions-right" style="${batchMode ? 'display: none' : ''}">
                    <span class="match-winner">${winner}${match.winner !== 'draw' ? ' 胜' : ''}</span>
                    <button class="btn-delete-match" data-match-id="${match.id}" title="删除记录">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // 绑定删除按钮事件
    container.querySelectorAll('.btn-delete-match').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const matchId = parseInt(e.currentTarget.dataset.matchId);
            deleteMatch(matchId);
        });
    });

    // 绑定复选框事件
    container.querySelectorAll('.match-checkbox input').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const matchId = parseInt(e.target.dataset.matchId);
            toggleMatchSelection(matchId);
        });
    });
}

// 切换比赛选择状态
function toggleMatchSelection(matchId) {
    if (selectedMatches.has(matchId)) {
        selectedMatches.delete(matchId);
    } else {
        selectedMatches.add(matchId);
    }
    updateBatchModeUI();
    renderMatchHistory();
}

// 更新批量模式 UI
function updateBatchModeUI() {
    document.getElementById('selected-count').textContent = selectedMatches.size;
}

// 进入批量模式
function enterBatchMode() {
    batchMode = true;
    selectedMatches.clear();
    document.getElementById('batch-mode-bar').style.display = 'flex';
    document.getElementById('btn-batch-delete').style.display = 'none';
    renderMatchHistory();
}

// 退出批量模式
function exitBatchMode() {
    batchMode = false;
    selectedMatches.clear();
    document.getElementById('batch-mode-bar').style.display = 'none';
    document.getElementById('btn-batch-delete').style.display = 'inline-flex';
    renderMatchHistory();
}

// 全选
function selectAllMatches() {
    const recentMatches = matchHistory.slice(0, 5);
    recentMatches.forEach(match => selectedMatches.add(match.id));
    updateBatchModeUI();
    renderMatchHistory();
}
// 批量删除比赛记录
function batchDeleteMatches() {
    if (selectedMatches.size === 0) {
        alert('请先选择要删除的比赛记录');
        return;
    }

    if (!confirm(`确定要删除 ${selectedMatches.size} 条比赛记录吗？此操作不可恢复。`)) {
        return;
    }

    const matchesToDelete = Array.from(selectedMatches);

    // 删除选中的比赛记录
    matchHistory = matchHistory.filter(m => !matchesToDelete.includes(m.id));

    // 清空选择
    selectedMatches.clear();

    // 重新计算统计数据（确保数据一致性）
    recalculateDoublesStats();

    // 保存数据到 localStorage
    saveLocalData();

    // 重置并重新渲染
    exitBatchMode();
    renderSinglesLeaderboard();
    renderDoublesLeaderboard();
    renderMatchHistory();
    renderPlayerCarousel();

    alert(`已删除 ${matchesToDelete.length} 条比赛记录`);
}

// 删除比赛记录
function deleteMatch(matchId) {
    const matchIndex = matchHistory.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;

    const match = matchHistory[matchIndex];

    // 确认删除
    if (!confirm(`确定要删除这场比赛记录吗？\n${match.team1} vs ${match.team2}`)) {
        return;
    }

    // 删除记录
    matchHistory.splice(matchIndex, 1);

    // 重新计算统计数据（确保数据一致性）
    recalculateDoublesStats();

    // 保存数据到 localStorage
    saveLocalData();

    // 重新渲染
    renderSinglesLeaderboard();
    renderDoublesLeaderboard();
    renderMatchHistory();
    renderPlayerCarousel();
}

// 填充选手选择下拉框
function populatePlayerSelects() {
    const selects = ['player1', 'player2', 'opponent1', 'opponent2'];
    const playerOptions = players.map(p =>
        `<option value="${p.id}">${p.name}</option>`
    ).join('');

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = playerOptions;
        }
    });

    // 双打模式下，选择选手后自动更新对手选项
    ['player1', 'player2'].forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.addEventListener('change', updateDoublesOpponents);
        }
    });
}

// 更新双打对手选项（自动排除已选择的队友）
function updateDoublesOpponents() {
    const matchType = document.getElementById('match-type').value;
    if (matchType !== 'doubles') return;

    const player1 = parseInt(document.getElementById('player1').value);
    const player2 = parseInt(document.getElementById('player2').value);

    // 已选择的队友
    const selectedTeammates = new Set([player1, player2]);

    // 剩下的选手作为对手候选
    const availableOpponents = players.filter(p => !selectedTeammates.has(p.id));

    const opponentOptions = availableOpponents.map(p =>
        `<option value="${p.id}">${p.name}</option>`
    ).join('');

    // 更新对手 1 和对手 2 的选项
    const opponent1Select = document.getElementById('opponent1');
    const opponent2Select = document.getElementById('opponent2');

    if (opponent1Select) opponent1Select.innerHTML = opponentOptions;
    if (opponent2Select) opponent2Select.innerHTML = opponentOptions;

    // 如果当前选择的对手不在可用列表中，自动调整为第一个可用对手
    if (availableOpponents.length >= 2) {
        opponent1Select.value = availableOpponents[0].id;
        opponent2Select.value = availableOpponents[1].id;
    }
}

// ================================
// 弹窗控制
// ================================

function openModal(type) {
    const modal = document.getElementById('modal-overlay');
    const matchTypeSelect = document.getElementById('match-type');
    const doublesFields = document.querySelectorAll('.doubles-field');
    const title = document.getElementById('modal-title');

    // 设置默认日期为今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('match-date').value = today;

    // 设置比赛类型
    if (type === 'singles') {
        matchTypeSelect.value = 'singles';
        title.textContent = '新建单打比赛';
        doublesFields.forEach(field => field.style.display = 'none');
    } else {
        matchTypeSelect.value = 'doubles';
        title.textContent = '新建双打比赛';
        doublesFields.forEach(field => field.style.display = 'block');
        // 初始化双打对手选项
        updateDoublesOpponents();
    }

    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('modal-overlay');
    modal.classList.remove('active');
    // 重置表单
    document.getElementById('match-form').reset();
}

// ================================
// 事件处理
// ================================

// 提交新比赛
function submitMatch() {
    const matchType = document.getElementById('match-type').value;
    const player1Score = parseInt(document.getElementById('player1-score').value) || 0;
    const opponent1Score = parseInt(document.getElementById('opponent1-score').value) || 0;

    // 获取选手名称
    const getPlayerName = (id) => players.find(p => p.id == id)?.name || '';

    let team1, team2;

    if (matchType === 'singles') {
        team1 = getPlayerName(document.getElementById('player1').value);
        team2 = getPlayerName(document.getElementById('opponent1').value);
        // 单打选手的统计数据由 recalculateDoublesStats 统一计算（此处不修改）
    } else {
        const player1Id = document.getElementById('player1').value;
        const player2Id = document.getElementById('player2').value;
        const opponent1Id = document.getElementById('opponent1').value;
        const opponent2Id = document.getElementById('opponent2').value;

        // 双打队伍名称按选手名字字母顺序排序，确保一致性
        const team1Names = [getPlayerName(player1Id), getPlayerName(player2Id)].sort();
        const team2Names = [getPlayerName(opponent1Id), getPlayerName(opponent2Id)].sort();
        team1 = team1Names.join('/');
        team2 = team2Names.join('/');

        // 如果双打组合不存在，创建新的（只初始化，不修改统计数据）
        const team1Players = [parseInt(player1Id), parseInt(player2Id)].sort((a, b) => a - b).join(',');
        const team2Players = [parseInt(opponent1Id), parseInt(opponent2Id)].sort((a, b) => a - b).join(',');

        let doublesTeam1 = doublesTeams.find(t => {
            const sortedTeamPlayers = [...t.players].sort((a, b) => a - b).join(',');
            return sortedTeamPlayers === team1Players;
        });
        let doublesTeam2 = doublesTeams.find(t => {
            const sortedTeamPlayers = [...t.players].sort((a, b) => a - b).join(',');
            return sortedTeamPlayers === team2Players;
        });

        // 如果组合不存在，创建新的（统计数据由 recalculateDoublesStats 统一计算）
        if (!doublesTeam1) {
            doublesTeam1 = {
                id: doublesTeams.length + 1,
                name: team1,
                players: [parseInt(player1Id), parseInt(player2Id)].sort((a, b) => a - b),
                points: 0,
                wins: 0,
                losses: 0,
                draws: 0
            };
            doublesTeams.push(doublesTeam1);
        }
        if (!doublesTeam2) {
            doublesTeam2 = {
                id: doublesTeams.length + 1,
                name: team2,
                players: [parseInt(opponent1Id), parseInt(opponent2Id)].sort((a, b) => a - b),
                points: 0,
                wins: 0,
                losses: 0,
                draws: 0
            };
            doublesTeams.push(doublesTeam2);
        }
    }

    // 添加比赛记录（使用时间戳生成唯一 ID，避免删除后重复）
    const matchDate = document.getElementById('match-date').value || new Date().toISOString().split('T')[0];
    const newMatch = {
        id: Date.now(),
        type: matchType,
        team1: team1,
        team2: team2,
        score: `${player1Score}:${opponent1Score}`,
        winner: player1Score > opponent1Score ? 'team1' : (player1Score < opponent1Score ? 'team2' : 'draw'),
        date: matchDate
    };

    matchHistory.unshift(newMatch);

    // 保存数据到 localStorage
    saveLocalData();

    // 重新计算双打统计数据（确保按小分计算）
    recalculateDoublesStats();

    // 重新渲染
    renderSinglesLeaderboard();
    renderDoublesLeaderboard();
    renderMatchHistory();
    renderCalendar();

    // 关闭弹窗
    closeModal();

    // 显示成功提示
    alert('比赛记录已保存！');
}

// ================================
// 日历渲染逻辑
// ================================

// 渲染日历
function renderCalendar() {
    const daysContainer = document.getElementById('calendar-days');
    const monthLabel = document.getElementById('current-month');

    if (!daysContainer) return;

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    // 更新月份显示
    const monthNames = ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月', '7 月', '8 月', '9 月', '10 月', '11 月', '12 月'];
    monthLabel.textContent = `${year}年 ${monthNames[month]}`;

    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay(); // 星期几 (0-6)
    const totalDays = lastDay.getDate();

    // 获取今天
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // 获取比赛日
    const matchDays = getMatchDays(year, month);

    // 渲染日期
    let daysHtml = '';

    // 空白格子
    for (let i = 0; i < startDay; i++) {
        daysHtml += '<div class="calendar-day empty"></div>';
    }

    // 日期格子
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isMatchDay = matchDays.has(dateStr);
        const isToday = isCurrentMonth && day === today.getDate();

        let classes = 'calendar-day';
        if (isMatchDay) classes += ' match-day';
        if (isToday) classes += ' current';

        daysHtml += `<div class="${classes}" data-date="${dateStr}">${day}</div>`;
    }

    daysContainer.innerHTML = daysHtml;

    // 绑定点击事件
    daysContainer.querySelectorAll('.calendar-day:not(.empty)').forEach(el => {
        el.addEventListener('click', (e) => {
            const dateStr = e.target.dataset.date;
            selectCalendarDate(dateStr);
        });
    });
}

// 获取当月有比赛的日期集合
function getMatchDays(year, month) {
    const matchDays = new Set();

    matchHistory.forEach(match => {
        const matchDate = new Date(match.date);
        if (matchDate.getFullYear() === year && matchDate.getMonth() === month) {
            matchDays.add(match.date);
        }
    });

    return matchDays;
}

// 选择日历日期
function selectCalendarDate(dateStr) {
    // 跳转到比赛日详情页
    window.location.href = `matchday.html?date=${dateStr}`;
}

// 显示当天比赛
function showDayMatches(dateStr) {
    const card = document.getElementById('day-matches-card');
    const title = document.getElementById('day-matches-title');
    const list = document.getElementById('day-matches-list');

    if (!card || !title || !list) return;

    // 解析日期
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    title.textContent = `${month}月${day}日 比赛记录`;

    // 过滤当天比赛
    const dayMatches = matchHistory.filter(match => match.date === dateStr);

    if (dayMatches.length === 0) {
        list.innerHTML = '<div class="day-match-empty" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl)">今天没有比赛记录</div>';
    } else {
        list.innerHTML = dayMatches.map(match => {
            const winner = match.winner === 'team1' ? match.team1 : (match.winner === 'team2' ? match.team2 : '平局');
            return `
                <div class="day-match-item">
                    <div class="day-match-type">${match.type === 'singles' ? '单打' : '双打'}</div>
                    <div class="day-match-teams">
                        <span>${match.team1}</span>
                        <span style="color:var(--color-text-muted)">vs</span>
                        <span>${match.team2}</span>
                    </div>
                    <span class="day-match-score">${match.score}</span>
                </div>
            `;
        }).join('');
    }

    card.style.display = 'block';
}

// 切换月份
function switchCalendarMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderCalendar();
}

// ================================
// 选手个人页面逻辑
// ================================

// 从 URL 获取选手 ID
function getPlayerIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const playerId = params.get('playerId');
    return playerId ? parseInt(playerId) : null;
}

// 获取选手对象
function getPlayerById(id) {
    return players.find(p => p.id === id);
}

// 计算选手统计数据
function calculatePlayerStats(player) {
    const stats = {
        points: player.points || 0,
        wins: player.wins || 0,
        losses: player.losses || 0,
        draws: player.draws || 0,
        winRate: 0,
        rank: 1,
        singlesWins: 0,
        singlesLosses: 0,
        singlesDraws: 0,
        doublesWins: 0,
        doublesLosses: 0,
        doublesDraws: 0,
        bestStreak: 0,
        recentForm: [], // 最近 5 场结果
        matches: [] // 比赛记录
    };

    // 计算总胜率（平局计为半场胜利）
    const totalGames = stats.wins + stats.losses + stats.draws;
    if (totalGames > 0) {
        stats.winRate = (((stats.wins + stats.draws * 0.5) / totalGames) * 100).toFixed(1);
    }

    // 计算排名
    const sortedPlayers = [...players].sort((a, b) => b.points - a.points);
    stats.rank = sortedPlayers.findIndex(p => p.id === player.id) + 1;

    // 从比赛记录中计算详细数据
    const playerMatches = matchHistory.filter(match => {
        if (match.type === 'singles') {
            return match.team1 === player.name || match.team2 === player.name;
        } else {
            return match.team1.includes(player.name) || match.team2.includes(player.name);
        }
    }).reverse(); // 按时间倒序

    playerMatches.forEach(match => {
        const isTeam1 = match.type === 'singles' ? match.team1 === player.name : match.team1.includes(player.name);
        const scores = match.score.split(':');
        const team1Score = parseInt(scores[0]) || 0;
        const team2Score = parseInt(scores[1]) || 0;

        let isWin = false;
        let isDraw = false;
        if (isTeam1) {
            if (team1Score > team2Score) isWin = true;
            else if (team1Score === team2Score) isDraw = true;
        } else {
            if (team2Score > team1Score) isWin = true;
            else if (team2Score === team1Score) isDraw = true;
        }

        // 记录比赛
        stats.matches.push({
            date: match.date,
            opponent: match.type === 'singles'
                ? (isTeam1 ? match.team2 : match.team1)
                : (isTeam1 ? match.team2 : match.team1),
            score: match.score,
            type: match.type,
            isWin: isWin,
            isDraw: isDraw,
            team: isTeam1 ? match.team1 : match.team2
        });

        // 计算单打/双打数据
        if (match.type === 'singles') {
            if (isWin) stats.singlesWins++;
            else if (isDraw) stats.singlesDraws++;
            else stats.singlesLosses++;
        } else {
            if (isWin) stats.doublesWins++;
            else if (isDraw) stats.doublesDraws++;
            else stats.doublesLosses++;
        }

        // 记录最近 5 场结果（W=胜，L=负，D=平）
        if (stats.recentForm.length < 5) {
            stats.recentForm.push(isDraw ? 'draw' : (isWin ? 'win' : 'loss'));
        }
    });

    // 计算最长连胜
    let currentStreak = 0;
    let maxStreak = 0;
    for (let i = stats.matches.length - 1; i >= 0; i--) {
        if (stats.matches[i].isWin) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    }
    stats.bestStreak = maxStreak;

    return stats;
}

// 计算最佳搭档
function findBestPartner(player) {
    const partnerStats = {};

    matchHistory.filter(match => match.type === 'doubles').forEach(match => {
        const team1Players = match.team1.split('/');
        const team2Players = match.team2.split('/');

        if (team1Players.includes(player.name)) {
            const partner = team1Players.find(p => p !== player.name);
            if (!partnerStats[partner]) {
                partnerStats[partner] = { wins: 0, losses: 0, draws: 0, avatar: '' };
            }
            const scores = match.score.split(':');
            const score1 = parseInt(scores[0]) || 0;
            const score2 = parseInt(scores[1]) || 0;
            if (score1 > score2) {
                partnerStats[partner].wins++;
            } else if (score1 === score2) {
                partnerStats[partner].draws++;
            } else {
                partnerStats[partner].losses++;
            }
        } else if (team2Players.includes(player.name)) {
            const partner = team2Players.find(p => p !== player.name);
            if (!partnerStats[partner]) {
                partnerStats[partner] = { wins: 0, losses: 0, draws: 0, avatar: '' };
            }
            const scores = match.score.split(':');
            const score1 = parseInt(scores[0]) || 0;
            const score2 = parseInt(scores[1]) || 0;
            if (score2 > score1) {
                partnerStats[partner].wins++;
            } else if (score1 === score2) {
                partnerStats[partner].draws++;
            } else {
                partnerStats[partner].losses++;
            }
        }
    });

    // 找到合作次数最多且胜率最高的搭档
    let bestPartner = null;
    let bestScore = -1;

    for (const [name, stats] of Object.entries(partnerStats)) {
        const totalGames = stats.wins + stats.losses + stats.draws;
        const winRate = totalGames > 0 ? ((stats.wins + stats.draws * 0.5) / totalGames) : 0;
        // 分数 = 合作次数 * 胜率
        const score = totalGames * winRate;

        if (score > bestScore) {
            bestScore = score;
            const partnerPlayer = players.find(p => p.name === name);
            bestPartner = {
                name: name,
                avatar: partnerPlayer ? partnerPlayer.avatar : name.charAt(0),
                wins: stats.wins,
                losses: stats.losses,
                draws: stats.draws,
                totalGames: totalGames
            };
        }
    }

    return bestPartner;
}

// 计算一生之敌（交手次数最多的对手）
function findArchRival(player) {
    const rivalStats = {};

    matchHistory.forEach(match => {
        const isPlayerInTeam1 = match.type === 'singles'
            ? match.team1 === player.name
            : match.team1.includes(player.name);

        const opponentTeam = isPlayerInTeam1 ? match.team2 : match.team1;
        const scores = match.score.split(':');
        const playerScore = isPlayerInTeam1 ? parseInt(scores[0]) : parseInt(scores[1]);
        const opponentScore = isPlayerInTeam1 ? parseInt(scores[1]) : parseInt(scores[0]);
        const isWin = playerScore > opponentScore;
        const isDraw = playerScore === opponentScore;

        if (match.type === 'singles') {
            // 单打对手
            if (!rivalStats[opponentTeam]) {
                const rivalPlayer = players.find(p => p.name === opponentTeam);
                rivalStats[opponentTeam] = {
                    name: opponentTeam,
                    avatar: rivalPlayer ? rivalPlayer.avatar : opponentTeam.charAt(0),
                    wins: 0,
                    losses: 0,
                    draws: 0
                };
            }
            if (isWin) {
                rivalStats[opponentTeam].wins++;
            } else if (isDraw) {
                rivalStats[opponentTeam].draws++;
            } else {
                rivalStats[opponentTeam].losses++;
            }
        } else {
            // 双打对手 - 对方队伍的每个人都算
            const opponents = opponentTeam.split('/');
            opponents.forEach(opponent => {
                if (!rivalStats[opponent]) {
                    const rivalPlayer = players.find(p => p.name === opponent);
                    rivalStats[opponent] = {
                        name: opponent,
                        avatar: rivalPlayer ? rivalPlayer.avatar : opponent.charAt(0),
                        wins: 0,
                        losses: 0,
                        draws: 0
                    };
                }
                if (isWin) {
                    rivalStats[opponent].wins++;
                } else if (isDraw) {
                    rivalStats[opponent].draws++;
                } else {
                    rivalStats[opponent].losses++;
                }
            });
        }
    });

    // 找到交手次数最多的对手
    let archRival = null;
    let maxGames = 0;

    for (const [name, stats] of Object.entries(rivalStats)) {
        const totalGames = stats.wins + stats.losses;
        if (totalGames > maxGames) {
            maxGames = totalGames;
            archRival = {
                ...stats,
                totalGames: totalGames
            };
        }
    }

    return archRival;
}

// 渲染个人页面
function renderPlayerProfile() {
    // 检查是否在个人页面
    const profileAvatar = document.getElementById('profile-avatar');
    if (!profileAvatar) return; // 不在个人页面

    let playerId = getPlayerIdFromUrl();
    if (!playerId) {
        // 如果没有指定选手 ID，默认显示第一个选手
        playerId = players[0].id;
    }

    const player = getPlayerById(playerId);
    if (!player) return;

    // 更新导航栏用户信息
    const navAvatar = document.getElementById('nav-user-avatar');
    const navName = document.getElementById('nav-user-name');
    if (navName) navName.textContent = player.name;
    if (navAvatar) {
        if (player.avatar.startsWith('data:image')) {
            navAvatar.innerHTML = `<img src="${player.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            navAvatar.textContent = player.avatar || player.name.charAt(0);
        }
    }

    // 计算统计数据
    const stats = calculatePlayerStats(player);
    const bestPartner = findBestPartner(player);
    const archRival = findArchRival(player);

    // 渲染基础信息
    profileAvatar.innerHTML = getAvatarHtml(player.avatar, 'large');
    document.getElementById('profile-name').textContent = player.name;

    // 渲染核心数据
    const drawText = stats.draws > 0 ? `/${stats.draws}平` : '';
    document.getElementById('stat-total-record').textContent = `${stats.wins}胜${stats.losses}负${drawText}`;
    document.getElementById('stat-win-rate').textContent = `${stats.winRate}%`;
    document.getElementById('stat-points').textContent = stats.points > 0 ? `+${stats.points}` : stats.points;
    document.getElementById('stat-rank').textContent = `#${stats.rank}`;

    // 渲染近期状态
    const formContainer = document.getElementById('recent-form');
    if (stats.recentForm.length === 0) {
        formContainer.innerHTML = '<span class="form-empty">暂无比赛记录</span>';
    } else {
        formContainer.innerHTML = stats.recentForm.map(result => {
            if (result === 'draw') return '<span class="form-dot draw">平</span>';
            if (result === 'win') return '<span class="form-dot win">胜</span>';
            return '<span class="form-dot loss">负</span>';
        }).join('');
    }

    // 渲染细分数据
    const singlesTotal = stats.singlesWins + stats.singlesLosses + stats.singlesDraws;
    const doublesTotal = stats.doublesWins + stats.doublesLosses + stats.doublesDraws;
    const singlesRate = singlesTotal > 0 ? (((stats.singlesWins + stats.singlesDraws * 0.5) / singlesTotal) * 100).toFixed(1) : '0';
    const doublesRate = doublesTotal > 0 ? (((stats.doublesWins + stats.doublesDraws * 0.5) / doublesTotal) * 100).toFixed(1) : '0';
    const singlesDrawText = stats.singlesDraws > 0 ? `/${stats.singlesDraws}平` : '';
    const doublesDrawText = stats.doublesDraws > 0 ? `/${stats.doublesDraws}平` : '';

    document.getElementById('stat-singles-rate').textContent = `${singlesRate}%`;
    document.getElementById('stat-singles-record').textContent = `${stats.singlesWins}胜${stats.singlesLosses}负${singlesDrawText}`;
    document.getElementById('stat-doubles-rate').textContent = `${doublesRate}%`;
    document.getElementById('stat-doubles-record').textContent = `${stats.doublesWins}胜${stats.doublesLosses}负${doublesDrawText}`;
    document.getElementById('stat-best-streak').textContent = `${stats.bestStreak}场`;

    // 渲染对战统计（与其他三人的单打胜率）
    renderVsStats(player);

    // 渲染比赛记录
    renderMatchHistoryList(stats.matches);
}

// 渲染对战统计（与其他三人的单打胜率）
function renderVsStats(currentPlayer) {
    const container = document.getElementById('vs-stats');
    if (!container) return;

    // 计算当前选手与其他每个选手的单打对战记录（统计小分）
    const vsRecords = [];

    players.forEach(opponent => {
        if (opponent.id === currentPlayer.id) return; // 跳过自己

        let wins = 0, losses = 0, draws = 0;

        matchHistory.forEach(match => {
            if (match.type !== 'singles') return; // 只统计单打

            const team1Name = match.team1;
            const team2Name = match.team2;

            // 检查当前选手和对手是否在这场比赛中
            const currentPlayerInTeam1 = team1Name === currentPlayer.name;
            const currentPlayerInTeam2 = team2Name === currentPlayer.name;
            const opponentInTeam1 = team1Name === opponent.name;
            const opponentInTeam2 = team2Name === opponent.name;

            // 只有两人直接对抗才统计
            if ((currentPlayerInTeam1 && opponentInTeam2) || (currentPlayerInTeam2 && opponentInTeam1)) {
                // 解析小分（如 "3:0" → 3 和 0）
                const scoreParts = match.score.split(':');
                const team1Score = parseInt(scoreParts[0]) || 0;
                const team2Score = parseInt(scoreParts[1]) || 0;

                // 确定当前选手的得分和对手的得分
                let playerScore, opponentScore;

                if (currentPlayerInTeam1) {
                    playerScore = team1Score;
                    opponentScore = team2Score;
                } else {
                    playerScore = team2Score;
                    opponentScore = team1Score;
                }

                // 统计小分
                wins += playerScore;
                losses += opponentScore;

                // 如果大场是平局，小分也记为平局
                if (match.winner === 'draw') {
                    draws += 1; // 平局场次
                }
            }
        });

        const totalGames = wins + losses;
        const winRate = totalGames > 0 ? ((wins / totalGames) * 100) : 0;

        vsRecords.push({
            opponent: opponent,
            wins: wins,
            losses: losses,
            draws: draws,
            totalGames: totalGames,
            winRate: winRate
        });
    });

    // 按胜率排序（从高到低）
    vsRecords.sort((a, b) => b.winRate - a.winRate);

    // 渲染 HTML
    if (vsRecords.length === 0) {
        container.innerHTML = '<div class="relation-empty">暂无对战记录</div>';
        return;
    }

    container.innerHTML = vsRecords.map(record => {
        const winRateClass = record.winRate >= 50 ? 'positive' : (record.winRate < 50 ? 'negative' : '');
        const winRateDisplay = record.totalGames > 0 ? `${record.winRate.toFixed(1)}%` : '-';
        const drawText = record.draws > 0 ? `/${record.draws}平` : '';

        return `
            <div class="vs-stat-box">
                <div class="vs-stat-header">
                    ${getAvatarHtml(record.opponent.avatar, 'small')}
                    <div class="vs-stat-info">
                        <div class="vs-opponent-name">${record.opponent.name}</div>
                        <div class="vs-stat-detail">${record.wins}胜${record.losses}负${drawText}</div>
                    </div>
                </div>
                <div class="vs-stat-row">
                    <span class="vs-stat-label">胜率</span>
                    <span class="vs-stat-value ${winRateClass}">${winRateDisplay}</span>
                </div>
                ${record.totalGames > 0 ? `
                <div class="vs-progress-bar">
                    <div class="vs-progress-fill" style="width: ${record.winRate}%; background: ${record.winRate >= 50 ? 'var(--color-success)' : 'var(--color-danger)'}"></div>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// 渲染比赛记录列表
function renderMatchHistoryList(matches) {
    const container = document.getElementById('match-history-list');
    const countLabel = document.getElementById('match-count');

    if (!container) return;

    countLabel.textContent = `${matches.length}场`;

    if (matches.length === 0) {
        container.innerHTML = '<div class="match-history-empty">暂无比赛记录</div>';
        return;
    }

    container.innerHTML = matches.map(match => {
        const opponentDisplay = match.opponent.includes('/') ? match.opponent : match.opponent;
        const resultClass = match.isDraw ? 'draw' : (match.isWin ? 'win' : 'loss');
        const resultText = match.isDraw ? '平' : (match.isWin ? '胜' : '负');
        return `
            <div class="match-history-item ${resultClass}">
                <div class="match-history-left">
                    <span class="match-history-date">${match.date}</span>
                    <div class="match-history-teams">
                        <span class="match-history-team ${match.team.includes('龙') ? 'self' : ''}">${match.team}</span>
                        <span class="match-history-vs">vs</span>
                        <span class="match-history-team ${!match.team.includes('龙') ? 'self' : ''}">${opponentDisplay}</span>
                    </div>
                    <span class="match-history-type">${match.type === 'singles' ? '单打' : '双打'}</span>
                </div>
                <div class="match-history-right">
                    <span class="match-history-score">${match.score}</span>
                    <span class="match-history-result ${resultClass}">${resultText}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ================================
// 比赛日详情页逻辑
// ================================

// 从 URL 获取日期参数
function getDateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('date');
}

// 渲染比赛日详情页
function renderMatchdayPage() {
    // 检查是否在比赛日详情页
    const matchdayDate = document.getElementById('matchday-date');
    if (!matchdayDate) return; // 不在比赛日详情页

    const dateStr = getDateFromUrl();
    if (!dateStr) {
        // 如果没有指定日期，默认显示今天
        const today = new Date().toISOString().split('T')[0];
        window.location.href = `matchday.html?date=${today}`;
        return;
    }

    // 解析日期
    const date = new Date(dateStr + 'T12:00:00'); // 避免时区问题
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[date.getDay()];

    // 更新页面标题
    document.getElementById('matchday-date').textContent = `${year}年${month}月${day}日`;
    document.getElementById('matchday-weekday').textContent = weekday;
    document.title = `${month}月${day}日 比赛记录 - 宿舍羽毛球排行榜`;

    // 获取当天比赛
    const dayMatches = matchHistory.filter(match => match.date === dateStr);

    // 更新比赛场数
    document.getElementById('total-matches').textContent = dayMatches.length;
    document.getElementById('matches-count').textContent = `${dayMatches.length}场`;

    // 获取参赛人员
    const playersSet = new Set();
    dayMatches.forEach(match => {
        if (match.type === 'singles') {
            playersSet.add(match.team1);
            playersSet.add(match.team2);
        } else {
            match.team1.split('/').forEach(p => playersSet.add(p));
            match.team2.split('/').forEach(p => playersSet.add(p));
        }
    });
    document.getElementById('total-players').textContent = playersSet.size;

    // 渲染比赛记录
    renderMatchdayMatches(dayMatches);

    // 计算并渲染趣味统计
    renderFunStats(dayMatches, dateStr);
}

// 渲染比赛记录
function renderMatchdayMatches(matches) {
    const container = document.getElementById('matchday-match-list');
    if (!container) return;

    if (matches.length === 0) {
        container.innerHTML = '<div class="matchday-match-empty">暂无比赛记录</div>';
        return;
    }

    container.innerHTML = matches.map(match => {
        const isDraw = match.winner === 'draw';
        const isWin = match.winner === 'team1';
        const resultClass = isDraw ? 'draw' : (isWin ? 'win' : 'loss');
        const resultText = isDraw ? '平' : (isWin ? '胜' : '负');
        return `
            <div class="matchday-match-item ${resultClass}">
                <div class="matchday-match-left">
                    <span class="matchday-match-type">${match.type === 'singles' ? '单打' : '双打'}</span>
                    <div class="matchday-match-teams">
                        <span class="matchday-match-team ${isWin ? 'self' : ''}">${match.team1}</span>
                        <span class="matchday-match-vs">vs</span>
                        <span class="matchday-match-team ${!isWin && !isDraw ? 'self' : ''}">${match.team2}</span>
                    </div>
                </div>
                <div class="matchday-match-right">
                    <span class="matchday-match-score">${match.score}</span>
                    <span class="matchday-match-result ${resultClass}">${resultText}</span>
                </div>
            </div>
        `;
    }).join('');
}

// 渲染趣味统计
function renderFunStats(matches, dateStr) {
    // 计算当日之星（胜率最高的选手）
    const playerStats = {};

    matches.forEach(match => {
        const isTeam1Win = match.winner === 'team1';
        const scores = match.score.split(':');
        const team1Score = parseInt(scores[0]) || 0;
        const team2Score = parseInt(scores[1]) || 0;

        if (match.type === 'singles') {
            // 单打
            const team1 = match.team1;
            const team2 = match.team2;

            if (!playerStats[team1]) playerStats[team1] = { wins: 0, losses: 0, draws: 0, points: 0 };
            if (!playerStats[team2]) playerStats[team2] = { wins: 0, losses: 0, draws: 0, points: 0 };

            if (match.winner === 'team1') {
                playerStats[team1].wins++;
                playerStats[team1].points += team1Score;
                playerStats[team2].losses++;
                playerStats[team2].points += team2Score;
            } else if (match.winner === 'team2') {
                playerStats[team2].wins++;
                playerStats[team2].points += team2Score;
                playerStats[team1].losses++;
                playerStats[team1].points += team1Score;
            } else if (match.winner === 'draw') {
                // 平局
                playerStats[team1].draws++;
                playerStats[team1].points += team1Score;
                playerStats[team2].draws++;
                playerStats[team2].points += team2Score;
            }
        } else {
            // 双打
            const team1Players = match.team1.split('/');
            const team2Players = match.team2.split('/');

            [...team1Players, ...team2Players].forEach(player => {
                if (!playerStats[player]) playerStats[player] = { wins: 0, losses: 0, draws: 0, points: 0 };
            });

            if (match.winner === 'team1') {
                team1Players.forEach(p => {
                    playerStats[p].wins++;
                    playerStats[p].points += team1Score;
                });
                team2Players.forEach(p => {
                    playerStats[p].losses++;
                    playerStats[p].points += team2Score;
                });
            } else if (match.winner === 'team2') {
                team2Players.forEach(p => {
                    playerStats[p].wins++;
                    playerStats[p].points += team2Score;
                });
                team1Players.forEach(p => {
                    playerStats[p].losses++;
                    playerStats[p].points += team1Score;
                });
            } else if (match.winner === 'draw') {
                // 平局
                team1Players.forEach(p => {
                    playerStats[p].draws++;
                    playerStats[p].points += team1Score;
                });
                team2Players.forEach(p => {
                    playerStats[p].draws++;
                    playerStats[p].points += team2Score;
                });
            }
        }
    });

    // 找到当日之星
    let starPlayer = null;
    let bestScore = -1;

    for (const [name, stats] of Object.entries(playerStats)) {
        const totalGames = stats.wins + stats.losses + stats.draws;
        const winRate = totalGames > 0 ? (stats.wins / totalGames) : 0;
        // 分数 = 胜场数 * 10 + 平局数 * 5 + 胜率 * 5 + 得分
        const score = stats.wins * 10 + stats.draws * 5 + winRate * 5 + stats.points;

        if (score > bestScore) {
            bestScore = score;
            const player = players.find(p => p.name === name);
            starPlayer = {
                name: name,
                avatar: player ? player.avatar : name.charAt(0),
                wins: stats.wins,
                losses: stats.losses,
                draws: stats.draws,
                points: stats.points
            };
        }
    }

    // 渲染当日之星
    const starContainer = document.getElementById('star-player');
    if (starPlayer) {
        const totalGames = starPlayer.wins + starPlayer.losses + starPlayer.draws;
        const winRate = totalGames > 0 ? ((starPlayer.wins / totalGames) * 100).toFixed(0) : 0;
        const drawText = starPlayer.draws > 0 ? `/${starPlayer.draws}平` : '';

        starContainer.innerHTML = `
            <div class="star-player">
                <div class="player-avatar-medium">${starPlayer.avatar}</div>
                <div class="player-name-medium">${starPlayer.name}</div>
                <div class="player-stats-detail">
                    <div class="stat-detail-item">
                        <span class="stat-detail-value">${starPlayer.wins}胜${starPlayer.losses}负${drawText}</span>
                        <span class="stat-detail-label">战绩</span>
                    </div>
                    <div class="stat-detail-item">
                        <span class="stat-detail-value">${winRate}%</span>
                        <span class="stat-detail-label">胜率</span>
                    </div>
                    <div class="stat-detail-item">
                        <span class="stat-detail-value">${starPlayer.points}</span>
                        <span class="stat-detail-label">得分</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        starContainer.innerHTML = '<div class="star-empty">暂无数据</div>';
    }

    // 计算最佳双打组合
    const teamStats = {};

    matches.filter(m => m.type === 'doubles').forEach(match => {
        const team1Players = match.team1.split('/').sort();
        const team2Players = match.team2.split('/').sort();
        const team1Name = team1Players.join('/');
        const team2Name = team2Players.join('/');

        if (!teamStats[team1Name]) teamStats[team1Name] = { wins: 0, losses: 0, draws: 0, players: team1Players };
        if (!teamStats[team2Name]) teamStats[team2Name] = { wins: 0, losses: 0, draws: 0, players: team2Players };

        if (match.winner === 'team1') {
            teamStats[team1Name].wins++;
            teamStats[team2Name].losses++;
        } else if (match.winner === 'team2') {
            teamStats[team2Name].wins++;
            teamStats[team1Name].losses++;
        } else if (match.winner === 'draw') {
            // 平局，两队都计为平局
            teamStats[team1Name].draws++;
            teamStats[team2Name].draws++;
        }
    });

    // 找到最佳组合
    let bestTeam = null;
    let bestTeamScore = -1;

    for (const [teamName, stats] of Object.entries(teamStats)) {
        const totalGames = stats.wins + stats.losses + stats.draws;
        const winRate = totalGames > 0 ? (stats.wins / totalGames) : 0;
        // 分数 = 胜场数 * 10 + 平局数 * 5 + 胜率 * 5
        const score = stats.wins * 10 + stats.draws * 5 + winRate * 5;

        if (score > bestTeamScore) {
            bestTeamScore = score;
            bestTeam = {
                name: teamName,
                players: stats.players,
                wins: stats.wins,
                losses: stats.losses,
                draws: stats.draws
            };
        }
    }

    // 渲染最佳组合
    const teamContainer = document.getElementById('best-team');
    if (bestTeam) {
        const avatars = bestTeam.players.map(playerName => {
            const player = players.find(p => p.name === playerName);
            return player ? player.avatar : playerName.charAt(0);
        });

        const totalGames = bestTeam.wins + bestTeam.losses + bestTeam.draws;
        const winRate = totalGames > 0 ? ((bestTeam.wins / totalGames) * 100).toFixed(0) : 0;
        const drawText = bestTeam.draws > 0 ? `/${bestTeam.draws}平` : '';

        teamContainer.innerHTML = `
            <div class="best-team">
                <div class="team-avatars">
                    ${avatars.map(avatar => `<div class="team-avatar">${avatar}</div>`).join('')}
                </div>
                <div class="team-info">
                    <div class="team-name">${bestTeam.name}</div>
                    <div class="team-record">${bestTeam.wins}胜${bestTeam.losses}负${drawText} 胜率${winRate}%</div>
                </div>
            </div>
        `;
    } else {
        teamContainer.innerHTML = '<div class="team-empty">暂无双打比赛</div>';
    }
}

// ================================
// 初始化
// ================================

// 页面初始化函数（可在 DOMContentLoaded 和 pageshow 中调用）
async function initializePage() {
    // 加载本地数据（等待完成）
    await loadLocalData();

    // 检查是否在个人页面
    const isProfilePage = document.getElementById('profile-avatar') !== null;

    // 检查是否在比赛日详情页
    const isMatchdayPage = document.getElementById('matchday-date') !== null;

    // 检查是否在管理后台（admin.html）
    const isAdminPage = document.getElementById('auth-overlay') !== null;

    if (isProfilePage) {
        // 在个人页面，渲染个人资料
        renderPlayerProfile();
    } else if (isMatchdayPage) {
        // 在比赛日详情页，渲染比赛日数据
        renderMatchdayPage();
    } else if (isAdminPage) {
        // 在管理后台，不需要渲染首页元素
        return;
    } else {
        // 在主页，执行原有的初始化逻辑
        // 初始渲染
        renderSinglesLeaderboard();
        renderDoublesLeaderboard();
        renderPlayerCarousel();
        renderMatchHistory();
        populatePlayerSelects();

        // 轮播按钮事件
        document.getElementById('prev-player').addEventListener('click', () => switchPlayer(-1));
        document.getElementById('next-player').addEventListener('click', () => switchPlayer(1));

        // 日历初始化和事件绑定
        renderCalendar();

        document.getElementById('prev-month').addEventListener('click', () => switchCalendarMonth(-1));
        document.getElementById('next-month').addEventListener('click', () => switchCalendarMonth(1));
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    await initializePage();
});

// 处理浏览器前进/后退缓存（bfcache）
window.addEventListener('pageshow', async function(event) {
    // 如果页面是从 bfcache 恢复的，重新初始化
    if (event.persisted) {
        await initializePage();
    }
});
