// ================================
// 引入 API Client
// ================================
// 注意：静态版本不使用 API，数据存储在 localStorage

// ================================
// 模拟数据
// ================================

// 选手数据（4 人制，但保留扩展性）
let players = [
    { id: 1, name: '龙鑫昊', avatar: '龙', points: 0, wins: 0, losses: 0, signature: '羽球狂人', play_type: 'both' },
    { id: 2, name: '黄玮', avatar: '黄', points: 0, wins: 0, losses: 0, signature: '扣杀之王', play_type: 'both' },
    { id: 3, name: '许力群', avatar: '许', points: 0, wins: 0, losses: 0, signature: '防守大师', play_type: 'both' },
    { id: 4, name: '林智鑫', avatar: '林', points: 0, wins: 0, losses: 0, signature: '网前小球', play_type: 'both' },
];

// 双打组合数据
let doublesTeams = [
    { id: 1, name: '龙鑫昊/黄玮', players: [1, 2], points: 0, wins: 0, losses: 0 },
    { id: 2, name: '许力群/林智鑫', players: [3, 4], points: 0, wins: 0, losses: 0 },
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
    try {
        // 添加时间戳防止缓存
        const response = await fetch('data.json?t=' + Date.now());
        if (response.ok) {
            const data = await response.json();

            // 处理数据（支持字符串或数组格式）
            if (data.players) {
                players = typeof data.players === 'string'
                    ? JSON.parse(data.players)
                    : data.players;
            }
            if (data.doublesTeams || data.doubles) {
                doublesTeams = typeof (data.doublesTeams || data.doubles) === 'string'
                    ? JSON.parse(data.doublesTeams || data.doubles)
                    : (data.doublesTeams || data.doubles);
            }
            if (data.matches) {
                matchHistory = typeof data.matches === 'string'
                    ? JSON.parse(data.matches)
                    : data.matches;
            }
            if (data.nextPlayerId) {
                window.nextPlayerId = typeof data.nextPlayerId === 'string'
                    ? parseInt(data.nextPlayerId)
                    : data.nextPlayerId;
            }

            console.log('数据加载成功:', players.length, '名选手', matchHistory.length, '场比赛');
            return;
        }
    } catch (e) {
        console.warn('无法加载 data.json（本地文件限制），使用内置初始数据');
    }

    // 如果 fetch 失败（本地文件限制），使用内置的初始数据
    console.log('使用内置初始数据');
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

// ================================
// 工具函数
// ================================

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
                        <div class="player-avatar">${player.avatar}</div>
                        <span class="player-name player-name-link">${player.name}</span>
                    </div>
                </td>
                <td>
                    <div class="stats-detail">
                        <span class="win-loss">${player.wins}胜${player.losses}负</span>
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
                        <span class="win-loss">${team.wins || 0}胜${team.losses || 0}负</span>
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
        <div class="avatar-large">${player.avatar}</div>
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

// 批量删除
function batchDeleteMatches() {
    if (selectedMatches.size === 0) {
        alert('请先选择要删除的比赛记录');
        return;
    }

    if (!confirm(`确定要删除选中的 ${selectedMatches.size} 条比赛记录吗？\n此操作不可撤销！`)) {
        return;
    }

    // 先收集要删除的比赛，避免在循环中修改数组
    const matchesToDelete = [];
    selectedMatches.forEach(matchId => {
        const match = matchHistory.find(m => m.id === matchId);
        if (match) {
            matchesToDelete.push(match);
        }
    });

    // 逐个撤销战绩并删除
    matchesToDelete.forEach(match => {
        // 解析比分
        const scores = match.score.split(':');
        const team1Score = parseInt(scores[0]) || 0;
        const team2Score = parseInt(scores[1]) || 0;

        const getPlayerByName = (name) => players.find(p => p.name === name);

        if (match.type === 'singles') {
            const player1 = getPlayerByName(match.team1);
            const player2 = getPlayerByName(match.team2);

            if (player1 && player2) {
                // 计算净胜场数
                const netWins = team1Score - team2Score;
                // 撤销：赢的场数减分，输的场数加分
                player1.points -= netWins;
                player2.points += netWins;

                // 撤销胜/负记录
                player1.wins -= team1Score;
                player1.losses -= team2Score;
                player2.wins -= team2Score;
                player2.losses -= team1Score;
            }
        } else {
            const team1Players = match.team1.split('/').sort();
            const team2Players = match.team2.split('/').sort();

            const doublesTeam1 = doublesTeams.find(t => {
                const teamNames = t.players.map(id => players.find(p => p.id === id)?.name).sort();
                return teamNames[0] === team1Players[0] && teamNames[1] === team1Players[1];
            });

            const doublesTeam2 = doublesTeams.find(t => {
                const teamNames = t.players.map(id => players.find(p => p.id === id)?.name).sort();
                return teamNames[0] === team2Players[0] && teamNames[1] === team2Players[1];
            });

            if (doublesTeam1 && doublesTeam2) {
                const netWins = team1Score - team2Score;
                doublesTeam1.points -= netWins;
                doublesTeam2.points += netWins;

                // 撤销胜/负记录
                doublesTeam1.wins -= team1Score;
                doublesTeam1.losses -= team2Score;
                doublesTeam2.wins -= team2Score;
                doublesTeam2.losses -= team1Score;
            }
        }

        // 从数组中删除该记录
        const index = matchHistory.findIndex(m => m.id === match.id);
        if (index > -1) {
            matchHistory.splice(index, 1);
        }
    });

    // 清空选择
    selectedMatches.clear();

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

    // 解析比分
    const scores = match.score.split(':');
    const team1Score = parseInt(scores[0]) || 0;
    const team2Score = parseInt(scores[1]) || 0;

    // 撤销积分更新
    const getPlayerByName = (name) => players.find(p => p.name === name);

    if (match.type === 'singles') {
        const player1 = getPlayerByName(match.team1);
        const player2 = getPlayerByName(match.team2);

        if (player1 && player2) {
            // 计算净胜场数
            const netWins = team1Score - team2Score;
            // 撤销：赢的场数减分，输的场数加分
            player1.points -= netWins;
            player2.points += netWins;

            // 撤销胜/负记录
            player1.wins -= team1Score;
            player1.losses -= team2Score;
            player2.wins -= team2Score;
            player2.losses -= team1Score;
        }
    } else {
        // 双打 - 找到对应的组合并撤销积分
        const team1Players = match.team1.split('/').sort();
        const team2Players = match.team2.split('/').sort();

        const doublesTeam1 = doublesTeams.find(t => {
            const teamNames = t.players.map(id => players.find(p => p.id === id)?.name).sort();
            return teamNames[0] === team1Players[0] && teamNames[1] === team1Players[1];
        });

        const doublesTeam2 = doublesTeams.find(t => {
            const teamNames = t.players.map(id => players.find(p => p.id === id)?.name).sort();
            return teamNames[0] === team2Players[0] && teamNames[1] === team2Players[1];
        });

        if (doublesTeam1 && doublesTeam2) {
            const netWins = team1Score - team2Score;
            doublesTeam1.points -= netWins;
            doublesTeam2.points += netWins;

            // 撤销胜/负记录
            doublesTeam1.wins -= team1Score;
            doublesTeam1.losses -= team2Score;
            doublesTeam2.wins -= team2Score;
            doublesTeam2.losses -= team1Score;
        }
    }

    // 删除记录
    matchHistory.splice(matchIndex, 1);

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

        // 更新选手积分：赢一把加 1 分，输一把减 1 分
        const player1 = players.find(p => p.id == document.getElementById('player1').value);
        const player2 = players.find(p => p.id == document.getElementById('opponent1').value);

        if (player1 && player2) {
            // 计算净胜场数
            const netWins = player1Score - opponent1Score;
            // 赢的场数加分，输的场数减分
            player1.points += netWins;
            player2.points -= netWins;

            // 更新胜/负记录：比分就是胜场数
            player1.wins += player1Score;
            player1.losses += opponent1Score;
            player2.wins += opponent1Score;
            player2.losses += player1Score;
        }
    } else {
        const player1Id = document.getElementById('player1').value;
        const player2Id = document.getElementById('player2').value;
        const opponent1Id = document.getElementById('opponent1').value;
        const opponent2Id = document.getElementById('opponent2').value;

        team1 = `${getPlayerName(player1Id)}/${getPlayerName(player2Id)}`;
        team2 = `${getPlayerName(opponent1Id)}/${getPlayerName(opponent2Id)}`;

        // 更新双打组合积分
        const team1Players = [player1Id, player2Id].sort().join(',');
        const team2Players = [opponent1Id, opponent2Id].sort().join(',');

        let doublesTeam1 = doublesTeams.find(t => t.players.sort().join(',') === team1Players);
        let doublesTeam2 = doublesTeams.find(t => t.players.sort().join(',') === team2Players);

        // 如果组合不存在，创建新的
        if (!doublesTeam1) {
            doublesTeam1 = {
                id: doublesTeams.length + 1,
                name: team1,
                players: [parseInt(player1Id), parseInt(player2Id)],
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
                players: [parseInt(opponent1Id), parseInt(opponent2Id)],
                points: 0,
                wins: 0,
                losses: 0,
                draws: 0
            };
            doublesTeams.push(doublesTeam2);
        }

        // 计算净胜场数
        const netWins = player1Score - opponent1Score;
        // 赢的场数加分，输的场数减分
        doublesTeam1.points += netWins;
        doublesTeam2.points -= netWins;

        // 更新胜/负记录：比分就是胜场数
        doublesTeam1.wins += player1Score;
        doublesTeam1.losses += opponent1Score;
        doublesTeam2.wins += opponent1Score;
        doublesTeam2.losses += player1Score;
    }

    // 添加比赛记录
    const matchDate = document.getElementById('match-date').value || new Date().toISOString().split('T')[0];
    const newMatch = {
        id: matchHistory.length + 1,
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
        winRate: 0,
        rank: 1,
        singlesWins: 0,
        singlesLosses: 0,
        doublesWins: 0,
        doublesLosses: 0,
        bestStreak: 0,
        recentForm: [], // 最近 5 场结果
        matches: [] // 比赛记录
    };

    // 计算总胜率
    const totalGames = stats.wins + stats.losses;
    if (totalGames > 0) {
        stats.winRate = ((stats.wins / totalGames) * 100).toFixed(1);
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
        if (isTeam1) {
            isWin = team1Score > team2Score;
        } else {
            isWin = team2Score > team1Score;
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
            team: isTeam1 ? match.team1 : match.team2
        });

        // 计算单打/双打数据
        if (match.type === 'singles') {
            if (isWin) stats.singlesWins++;
            else stats.singlesLosses++;
        } else {
            if (isWin) stats.doublesWins++;
            else stats.doublesLosses++;
        }

        // 记录最近 5 场结果
        if (stats.recentForm.length < 5) {
            stats.recentForm.push(isWin);
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
                partnerStats[partner] = { wins: 0, losses: 0, avatar: '' };
            }
            const scores = match.score.split(':');
            if (parseInt(scores[0]) > parseInt(scores[1])) {
                partnerStats[partner].wins++;
            } else {
                partnerStats[partner].losses++;
            }
        } else if (team2Players.includes(player.name)) {
            const partner = team2Players.find(p => p !== player.name);
            if (!partnerStats[partner]) {
                partnerStats[partner] = { wins: 0, losses: 0, avatar: '' };
            }
            const scores = match.score.split(':');
            if (parseInt(scores[1]) > parseInt(scores[0])) {
                partnerStats[partner].wins++;
            } else {
                partnerStats[partner].losses++;
            }
        }
    });

    // 找到合作次数最多且胜率最高的搭档
    let bestPartner = null;
    let bestScore = -1;

    for (const [name, stats] of Object.entries(partnerStats)) {
        const totalGames = stats.wins + stats.losses;
        const winRate = totalGames > 0 ? (stats.wins / totalGames) : 0;
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

        if (match.type === 'singles') {
            // 单打对手
            if (!rivalStats[opponentTeam]) {
                const rivalPlayer = players.find(p => p.name === opponentTeam);
                rivalStats[opponentTeam] = {
                    name: opponentTeam,
                    avatar: rivalPlayer ? rivalPlayer.avatar : opponentTeam.charAt(0),
                    wins: 0,
                    losses: 0
                };
            }
            if (isWin) {
                rivalStats[opponentTeam].wins++;
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
                        losses: 0
                    };
                }
                if (isWin) {
                    rivalStats[opponent].wins++;
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

    const playerId = getPlayerIdFromUrl();
    if (!playerId) {
        // 如果没有指定选手 ID，默认显示第一个选手
        playerId = players[0].id;
    }

    const player = getPlayerById(playerId);
    if (!player) return;

    // 更新导航栏用户信息
    const navAvatar = document.getElementById('nav-user-avatar');
    const navName = document.getElementById('nav-user-name');
    if (navAvatar) navAvatar.textContent = player.avatar;
    if (navName) navName.textContent = player.name;

    // 计算统计数据
    const stats = calculatePlayerStats(player);
    const bestPartner = findBestPartner(player);
    const archRival = findArchRival(player);

    // 渲染基础信息
    document.getElementById('profile-avatar').textContent = player.avatar;
    document.getElementById('profile-name').textContent = player.name;

    // 渲染核心数据
    document.getElementById('stat-total-record').textContent = `${stats.wins}胜${stats.losses}负`;
    document.getElementById('stat-win-rate').textContent = `${stats.winRate}%`;
    document.getElementById('stat-points').textContent = stats.points > 0 ? `+${stats.points}` : stats.points;
    document.getElementById('stat-rank').textContent = `#${stats.rank}`;

    // 渲染近期状态
    const formContainer = document.getElementById('recent-form');
    if (stats.recentForm.length === 0) {
        formContainer.innerHTML = '<span class="form-empty">暂无比赛记录</span>';
    } else {
        formContainer.innerHTML = stats.recentForm.map(isWin =>
            `<span class="form-dot ${isWin ? 'win' : 'loss'}">${isWin ? '胜' : '负'}</span>`
        ).join('');
    }

    // 渲染细分数据
    const singlesTotal = stats.singlesWins + stats.singlesLosses;
    const doublesTotal = stats.doublesWins + stats.doublesLosses;
    const singlesRate = singlesTotal > 0 ? ((stats.singlesWins / singlesTotal) * 100).toFixed(1) : '0';
    const doublesRate = doublesTotal > 0 ? ((stats.doublesWins / doublesTotal) * 100).toFixed(1) : '0';

    document.getElementById('stat-singles-rate').textContent = `${singlesRate}%`;
    document.getElementById('stat-singles-record').textContent = `${stats.singlesWins}胜${stats.singlesLosses}负`;
    document.getElementById('stat-doubles-rate').textContent = `${doublesRate}%`;
    document.getElementById('stat-doubles-record').textContent = `${stats.doublesWins}胜${stats.doublesLosses}负`;
    document.getElementById('stat-best-streak').textContent = `${stats.bestStreak}场`;

    // 渲染最佳搭档
    const partnerContainer = document.getElementById('best-partner');
    if (bestPartner) {
        partnerContainer.innerHTML = `
            <div class="relation-partner">
                <div class="partner-avatar">${bestPartner.avatar}</div>
                <div class="partner-info">
                    <div class="partner-name">${bestPartner.name}</div>
                    <div class="partner-stats">${bestPartner.wins}胜${bestPartner.losses}负</div>
                </div>
            </div>
        `;
    } else {
        partnerContainer.innerHTML = '<div class="relation-empty">暂无数据</div>';
    }

    // 渲染一生之敌
    const rivalContainer = document.getElementById('arch-rival');
    if (archRival) {
        rivalContainer.innerHTML = `
            <div class="relation-partner">
                <div class="partner-avatar">${archRival.avatar}</div>
                <div class="partner-info">
                    <div class="partner-name">${archRival.name}</div>
                    <div class="partner-stats">交手${archRival.totalGames}场 ${archRival.wins}胜${archRival.losses}负</div>
                </div>
            </div>
        `;
    } else {
        rivalContainer.innerHTML = '<div class="relation-empty">暂无数据</div>';
    }

    // 渲染比赛记录
    renderMatchHistoryList(stats.matches);
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
        return `
            <div class="match-history-item ${match.isWin ? 'win' : 'loss'}">
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
                    <span class="match-history-result ${match.isWin ? 'win' : 'loss'}">${match.isWin ? '胜' : '负'}</span>
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
        const isWin = match.winner === 'team1';
        return `
            <div class="matchday-match-item ${isWin ? 'win' : 'loss'}">
                <div class="matchday-match-left">
                    <span class="matchday-match-type">${match.type === 'singles' ? '单打' : '双打'}</span>
                    <div class="matchday-match-teams">
                        <span class="matchday-match-team ${isWin ? 'self' : ''}">${match.team1}</span>
                        <span class="matchday-match-vs">vs</span>
                        <span class="matchday-match-team ${!isWin ? 'self' : ''}">${match.team2}</span>
                    </div>
                </div>
                <div class="matchday-match-right">
                    <span class="matchday-match-score">${match.score}</span>
                    <span class="matchday-match-result ${isWin ? 'win' : 'loss'}">${isWin ? '胜' : '负'}</span>
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

            if (!playerStats[team1]) playerStats[team1] = { wins: 0, losses: 0, points: 0 };
            if (!playerStats[team2]) playerStats[team2] = { wins: 0, losses: 0, points: 0 };

            if (isTeam1Win) {
                playerStats[team1].wins++;
                playerStats[team1].points += team1Score;
                playerStats[team2].losses++;
                playerStats[team2].points += team2Score;
            } else {
                playerStats[team2].wins++;
                playerStats[team2].points += team2Score;
                playerStats[team1].losses++;
                playerStats[team1].points += team1Score;
            }
        } else {
            // 双打
            const team1Players = match.team1.split('/');
            const team2Players = match.team2.split('/');

            [...team1Players, ...team2Players].forEach(player => {
                if (!playerStats[player]) playerStats[player] = { wins: 0, losses: 0, points: 0 };
            });

            if (isTeam1Win) {
                team1Players.forEach(p => {
                    playerStats[p].wins++;
                    playerStats[p].points += team1Score;
                });
                team2Players.forEach(p => {
                    playerStats[p].losses++;
                    playerStats[p].points += team2Score;
                });
            } else {
                team2Players.forEach(p => {
                    playerStats[p].wins++;
                    playerStats[p].points += team2Score;
                });
                team1Players.forEach(p => {
                    playerStats[p].losses++;
                    playerStats[p].points += team1Score;
                });
            }
        }
    });

    // 找到当日之星
    let starPlayer = null;
    let bestScore = -1;

    for (const [name, stats] of Object.entries(playerStats)) {
        const totalGames = stats.wins + stats.losses;
        const winRate = totalGames > 0 ? (stats.wins / totalGames) : 0;
        // 分数 = 胜场数 * 10 + 胜率 * 5 + 得分
        const score = stats.wins * 10 + winRate * 5 + stats.points;

        if (score > bestScore) {
            bestScore = score;
            const player = players.find(p => p.name === name);
            starPlayer = {
                name: name,
                avatar: player ? player.avatar : name.charAt(0),
                wins: stats.wins,
                losses: stats.losses,
                points: stats.points
            };
        }
    }

    // 渲染当日之星
    const starContainer = document.getElementById('star-player');
    if (starPlayer) {
        const totalGames = starPlayer.wins + starPlayer.losses;
        const winRate = totalGames > 0 ? ((starPlayer.wins / totalGames) * 100).toFixed(0) : 0;
        starContainer.innerHTML = `
            <div class="star-player">
                <div class="player-avatar-medium">${starPlayer.avatar}</div>
                <div class="player-name-medium">${starPlayer.name}</div>
                <div class="player-stats-detail">
                    <div class="stat-detail-item">
                        <span class="stat-detail-value">${starPlayer.wins}胜${starPlayer.losses}负</span>
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

        if (!teamStats[team1Name]) teamStats[team1Name] = { wins: 0, losses: 0, players: team1Players };
        if (!teamStats[team2Name]) teamStats[team2Name] = { wins: 0, losses: 0, players: team2Players };

        if (match.winner === 'team1') {
            teamStats[team1Name].wins++;
            teamStats[team2Name].losses++;
        } else {
            teamStats[team2Name].wins++;
            teamStats[team1Name].losses++;
        }
    });

    // 找到最佳组合
    let bestTeam = null;
    let bestTeamScore = -1;

    for (const [teamName, stats] of Object.entries(teamStats)) {
        const totalGames = stats.wins + stats.losses;
        const winRate = totalGames > 0 ? (stats.wins / totalGames) : 0;
        const score = stats.wins * 10 + winRate * 5;

        if (score > bestTeamScore) {
            bestTeamScore = score;
            bestTeam = {
                name: teamName,
                players: stats.players,
                wins: stats.wins,
                losses: stats.losses
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

        const totalGames = bestTeam.wins + bestTeam.losses;
        const winRate = totalGames > 0 ? ((bestTeam.wins / totalGames) * 100).toFixed(0) : 0;

        teamContainer.innerHTML = `
            <div class="best-team">
                <div class="team-avatars">
                    ${avatars.map(avatar => `<div class="team-avatar">${avatar}</div>`).join('')}
                </div>
                <div class="team-info">
                    <div class="team-name">${bestTeam.name}</div>
                    <div class="team-record">${bestTeam.wins}胜${bestTeam.losses}负 胜率${winRate}%</div>
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

document.addEventListener('DOMContentLoaded', async function() {
    // 加载本地数据（等待完成）
    await loadLocalData();

    // 检查是否在个人页面
    const isProfilePage = document.getElementById('profile-avatar') !== null;

    // 检查是否在比赛日详情页
    const isMatchdayPage = document.getElementById('matchday-date') !== null;

    if (isProfilePage) {
        // 在个人页面，渲染个人资料
        renderPlayerProfile();
    } else if (isMatchdayPage) {
        // 在比赛日详情页，渲染比赛日数据
        renderMatchdayPage();
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
});
