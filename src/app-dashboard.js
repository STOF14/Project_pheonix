const MEAL_ROTATION = window.ProjectPhoenixData.mealRotation;

const CHALLENGE_START = new Date('2026-02-15');
const CHALLENGE_REQUIREMENTS = ['workout', 'water', 'clean_eating', 'bible', 'photo', 'strava', 'recovery'];

const TRAINING_START = new Date('2026-02-15');
const SOWETO_RACE = new Date('2026-11-29');

const RACES = [
    { name: 'Tshwane 10K', date: new Date('2026-08-23'), distance: '10K' },
    { name: 'Brooklyn 10K', date: new Date('2026-09-05'), distance: '10K' },
    { name: 'Tuks 5K', date: new Date('2026-09-16'), distance: '5K' },
    { name: 'Ford Half', date: new Date('2026-09-26'), distance: '21.1K' },
    { name: 'SOWETO', date: new Date('2026-11-29'), distance: '21.1K' }
];

function getChallengeData() {
    return window.ProjectPhoenixUtils.getStoredJson('challenge75_data', { completedDays: [], penalties: 0, dayCheckboxes: {} });
}

function saveChallengeData(data) {
    window.ProjectPhoenixUtils.setStoredJson('challenge75_data', data);
}

function toggleChallengeCheck(el, index) {
    el.classList.toggle('checked');
    updateChecklistCount();
}

function updateChecklistCount() {
    const checkboxes = document.querySelectorAll('#checklist .checkbox');
    let checked = 0;
    checkboxes.forEach(cb => { if (cb.classList.contains('checked')) checked++; });
    const el = document.getElementById('checklistProgress');
    if (el) {
        el.textContent = `${checked}/7 completed today`;
        el.style.background = checked === 7 ? '#000' : '#F5F5F5';
        el.style.color = checked === 7 ? '#fff' : '#000';
    }
    const el2 = document.getElementById('checklistCompleted');
    if (el2) el2.textContent = `${checked}/7`;
}

function markDayComplete() {
    const data = getChallengeData();
    const today = new Date().toISOString().split('T')[0];

    if (!data.completedDays.includes(today)) {
        data.completedDays.push(today);
        saveChallengeData(data);
        updateChallengeDisplay();
        alert('Day marked complete! 🔥 Keep going!');
    } else {
        alert('Today is already marked complete!');
    }
}

function addPenalty() {
    if (!confirm('Add +1 penalty day? (You missed a requirement today)')) return;
    const data = getChallengeData();
    data.penalties = (data.penalties || 0) + 1;
    saveChallengeData(data);
    updateChallengeDisplay();
}

function updateChallengeDisplay() {
    const today = new Date();
    const data = getChallengeData();
    const daysSinceStart = Math.floor((today - CHALLENGE_START) / (1000 * 60 * 60 * 24));
    const completedCount = data.completedDays ? data.completedDays.length : 0;
    const penalties = data.penalties || 0;
    const target = 75 + penalties;
    const remaining = Math.max(0, target - completedCount);
    const progress = Math.min(100, Math.round((completedCount / target) * 100));

    const calendarDay = daysSinceStart + 1;
    const dayNum = document.getElementById('challengeDayNum');
    if (dayNum) {
        if (daysSinceStart < 0) {
            dayNum.textContent = '0';
        } else if (daysSinceStart >= 75 && completedCount >= target) {
            dayNum.textContent = '✓';
        } else {
            dayNum.textContent = calendarDay;
        }
    }

    const status = document.getElementById('challengeDayStatus');
    if (status) {
        if (daysSinceStart < 0) status.textContent = 'Challenge starts February 15, 2026';
        else if (completedCount >= target) status.textContent = '🏆 CHALLENGE COMPLETE! You did it!';
        else status.textContent = `${completedCount} days completed — ${remaining} to go (target: ${target})`;
    }

    const penaltyInfo = document.getElementById('challengePenaltyInfo');
    if (penaltyInfo) {
        penaltyInfo.textContent = penalties > 0 ? `⚠️ ${penalties} penalty day${penalties > 1 ? 's' : ''} added — target is now ${target} days` : '';
    }

    const el = document.getElementById('daysCompleted');
    if (el) el.textContent = completedCount;
    const el2 = document.getElementById('penaltiesAdded');
    if (el2) el2.textContent = penalties;
    const el3 = document.getElementById('targetDaysLeft');
    if (el3) el3.textContent = remaining;

    const bar = document.getElementById('challenge75Bar');
    if (bar) bar.style.width = progress + '%';
    const pct = document.getElementById('challenge75Percent');
    if (pct) pct.textContent = `${progress}% complete (${completedCount}/${target} days)`;

    const streakEl = document.getElementById('checklistStreak');
    if (streakEl) streakEl.textContent = completedCount;

    const cdEl = document.getElementById('checklistChallengeDay');
    if (cdEl) cdEl.textContent = daysSinceStart < 0 ? '-' : calendarDay;

    drawChallengeGrid(data, target);
}

function drawChallengeGrid(data, target) {
    const container = document.getElementById('challengeGrid');
    if (!container) return;

    const totalCells = Math.max(75, target);
    let html = '';

    for (let i = 1; i <= totalCells; i++) {
        const dateObj = new Date(CHALLENGE_START);
        dateObj.setDate(dateObj.getDate() + i - 1);
        const dateStr = dateObj.toISOString().split('T')[0];
        const isComplete = data.completedDays && data.completedDays.includes(dateStr);
        const today = new Date().toISOString().split('T')[0];
        const isToday = dateStr === today;
        const isPenalty = i > 75;

        const bg = isComplete ? '#000' : (isToday ? '#FF0000' : '#F5F5F5');
        const color = isComplete ? '#fff' : (isToday ? '#fff' : '#BDBDBD');
        const border = isPenalty ? '2px solid #FF0000' : '1px solid #E0E0E0';

        html += `<div style="aspect-ratio:1; display:flex; align-items:center; justify-content:center; background:${bg}; color:${color}; font-size:10px; font-weight:700; font-family:'IBM Plex Mono',monospace; border:${border}; cursor:default;" title="Day ${i}: ${dateStr}">${i}</div>`;
    }

    container.innerHTML = html;
}

function resetChallengeTracker() {
    if (!confirm('Reset the entire 75-day challenge tracker? All data will be lost.')) return;
    localStorage.removeItem('challenge75_data');
    updateChallengeDisplay();
}

function exportChallengeData() {
    const data = getChallengeData();
    const text = `280 Days Challenge Progress\nCompleted: ${data.completedDays ? data.completedDays.length : 0} days\nPenalties: ${data.penalties || 0}\nTarget: ${75 + (data.penalties || 0)} days\nProgress: ${Math.round(((data.completedDays ? data.completedDays.length : 0) / (75 + (data.penalties || 0))) * 100)}%`;
    navigator.clipboard.writeText(text).then(() => alert('Progress copied to clipboard!')).catch(() => alert(text));
}

function updateDynamicStats() {
    const today = new Date();
    const daysSinceStart = Math.floor((today - TRAINING_START) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.max(0, Math.min(44, Math.ceil(daysSinceStart / 7)));

    const weekEl = document.getElementById('currentWeekNum');
    if (weekEl) {
        weekEl.textContent = daysSinceStart < 0 ? 'Pre-Start' : currentWeek > 44 ? 'Done!' : `Week ${currentWeek}`;
    }

    const daysToSoweto = Math.ceil((SOWETO_RACE - today) / (1000 * 60 * 60 * 24));
    const sow = document.getElementById('daysToSoweto');
    if (sow) {
        sow.textContent = daysToSoweto < 0 ? 'Done!' : daysToSoweto === 0 ? 'TODAY!' : daysToSoweto;
        if (daysToSoweto === 0) sow.style.color = 'var(--red)';
    }

    const nextRace = RACES.find(race => race.date >= today);
    const nextRaceEl = document.getElementById('nextRaceName');
    if (nextRaceEl && nextRace) {
        const daysToRace = Math.ceil((nextRace.date - today) / (1000 * 60 * 60 * 24));
        nextRaceEl.textContent = daysToRace === 0 ? 'TODAY!' : `${nextRace.name} (${daysToRace}d)`;
    }

    updateWeekProgress();
    updateStreak();
}

function updateWeekProgress() {
    const today = new Date();
    const weekKey = window.ProjectPhoenixUtils.getTrainingWeekKey(TRAINING_START, today);
    const completed = window.ProjectPhoenixUtils.getStoredJson(weekKey, []);

    if (document.getElementById('weekProgress')) {
        document.getElementById('weekProgress').textContent = `${completed.length}/7`;
    }
    if (document.getElementById('thisWeekComplete')) {
        document.getElementById('thisWeekComplete').textContent = `${completed.length}/7`;
    }
}

function markWorkoutComplete() {
    const today = new Date();
    const weekKey = window.ProjectPhoenixUtils.getTrainingWeekKey(TRAINING_START, today);
    const dayKey = window.ProjectPhoenixUtils.getIsoDateKey(today);

    let completed = window.ProjectPhoenixUtils.getStoredJson(weekKey, []);

    if (!completed.includes(dayKey)) {
        completed.push(dayKey);
        window.ProjectPhoenixUtils.setStoredJson(weekKey, completed);

        const total = parseInt(localStorage.getItem('totalWorkouts') || '0') + 1;
        localStorage.setItem('totalWorkouts', total.toString());
        if (document.getElementById('totalWorkouts')) {
            document.getElementById('totalWorkouts').textContent = total;
        }

        updateStreak();
        updateWeekProgress();
        alert('Workout logged! Keep going!');
        const button = document.getElementById('workoutCompleteButton');
        if (button) button.style.display = 'none';
    } else {
        alert('Already logged!');
    }
}

function updateStreak() {
    const total = parseInt(localStorage.getItem('totalWorkouts') || '0');
    if (document.getElementById('totalStreak')) {
        document.getElementById('totalStreak').textContent = total;
    }
    if (document.getElementById('currentStreak')) {
        document.getElementById('currentStreak').textContent = `${total} total`;
    }
}

function logWeight() {
    const week = parseInt(document.getElementById('weightWeek').value);
    const weight = parseFloat(document.getElementById('weightValue').value);
    const waist = parseInt(document.getElementById('waistValue').value);

    if (!week && week !== 0) { alert('Enter week (0-44)'); return; }
    if (!weight) { alert('Enter weight'); return; }

    const data = JSON.parse(localStorage.getItem('weightData') || '{}');
    data[week] = { weight, waist, date: new Date().toISOString() };
    localStorage.setItem('weightData', JSON.stringify(data));

    document.getElementById('weightWeek').value = '';
    document.getElementById('weightValue').value = '';
    document.getElementById('waistValue').value = '';

    drawWeightChart();
    alert(`Week ${week}: ${weight}kg logged!`);
}

function clearWeightData() {
    if (confirm('Clear all weight data?')) {
        localStorage.removeItem('weightData');
        drawWeightChart();
    }
}

function drawWeightChart() {
    const canvas = document.getElementById('weightCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const data = JSON.parse(localStorage.getItem('weightData') || '{}');
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.font = '11px "IBM Plex Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('Week 0', padding, canvas.height - padding + 20);
    ctx.fillText('Week 44', canvas.width - padding, canvas.height - padding + 20);
    ctx.textAlign = 'right';
    ctx.fillText('95kg', padding - 10, padding + 5);
    ctx.fillText('82kg', padding - 10, canvas.height - padding + 5);

    const goalY = canvas.height - padding - ((85 - 95) / (82 - 95)) * chartHeight;
    ctx.strokeStyle = '#FF0000';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding, goalY);
    ctx.lineTo(canvas.width - padding, goalY);
    ctx.stroke();
    ctx.setLineDash([]);

    const weeks = Object.keys(data).map(Number).sort((a, b) => a - b);
    if (weeks.length > 0) {
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.beginPath();

        weeks.forEach((week, i) => {
            const x = padding + (week / 44) * chartWidth;
            const y = canvas.height - padding - ((data[week].weight - 95) / (82 - 95)) * chartHeight;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
        });
        ctx.stroke();

        const latest = Math.max(...weeks);
        const current = data[latest].weight;
        const currentWeight = document.getElementById('currentWeight');
        const totalLost = document.getElementById('totalLost');
        if (currentWeight) currentWeight.textContent = `${current}kg`;
        if (totalLost) totalLost.textContent = `${(95 - current).toFixed(1)}kg`;
    } else {
        ctx.fillStyle = '#999';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No data yet - start logging!', canvas.width / 2, canvas.height / 2);
    }
}

function updateRaceCountdown() {
    const container = document.getElementById('upcomingRaceCard');
    if (!container) return;

    const today = new Date();
    const next = RACES.find(r => r.date >= today);

    if (next) {
        const days = Math.ceil((next.date - today) / (1000 * 60 * 60 * 24));
        const style = days <= 7 ? 'background: var(--red); color: var(--white);' : 'background: var(--black); color: var(--white);';
        container.innerHTML = `
            <div class="card" style="${style}">
                <div class="card-title" style="font-size: 24px;">${next.name.toUpperCase()}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--spacing-lg); margin-top: var(--spacing-md); text-align: center;">
                    <div><div style="font-size: 48px; font-weight: 900;">${days}</div><div style="font-size: 11px; opacity: 0.8;">DAYS</div></div>
                    <div><div style="font-size: 24px; font-weight: 700;">${next.distance}</div><div style="font-size: 11px; opacity: 0.8;">DISTANCE</div></div>
                    <div><div style="font-size: 16px; font-weight: 700;">${next.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div><div style="font-size: 11px; opacity: 0.8;">DATE</div></div>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = '<div class="card" style="background: var(--black); color: var(--white);"><p style="margin:0;">All races complete!</p></div>';
    }
}

function calculateRaceTimeline() {
    const time = document.getElementById('raceStartTime').value;
    if (!time) { alert('Enter race start time'); return; }

    const [h, m] = time.split(':').map(Number);
    const start = new Date();
    start.setHours(h, m, 0);

    const timeline = [
        [-180, 'WAKE UP'], [-165, 'BREAKFAST'], [-90, 'Leave'], [-60, 'Arrive'],
        [-45, 'WARM-UP'], [-15, 'Corral'], [-5, 'Ready'], [0, 'START!', true]
    ];

    let html = '<table style="margin:0; width:100%;"><tbody>';
    timeline.forEach(([offset, label, highlight]) => {
        const t = new Date(start.getTime() + offset * 60000);
        const ts = t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        html += `<tr ${highlight ? 'style="background: var(--red); color: white;"' : ''}><td class="text-mono" style="padding: var(--spacing-sm);"><strong>${ts}</strong></td><td style="padding: var(--spacing-sm);">${label}</td></tr>`;
    });
    html += '</tbody></table>';
    const output = document.getElementById('raceTimelineOutput');
    if (output) output.innerHTML = html;
}

function showMealWeekDirect(week) {
    const container = document.getElementById('mealWeekDetails');
    if (!container) return;

    const data = getMealWeekData(week);
    if (!data) return;

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); margin-top: var(--spacing-lg);">
            <div class="card">
                <div class="card-header"><div class="card-title">🌅 Breakfasts — Week ${week}</div></div>
                <table style="margin: 0;"><thead><tr><th>Days</th><th>Meal</th></tr></thead><tbody>${data.breakfasts.map(b => `<tr><td class="text-mono" style="white-space: nowrap;">${b.days}</td><td>${b.meal}</td></tr>`).join('')}</tbody></table>
            </div>
            <div class="card">
                <div class="card-header"><div class="card-title">🍞 Lunches — Week ${week}</div></div>
                <table style="margin: 0;"><thead><tr><th>Days</th><th>Meal</th></tr></thead><tbody>${data.lunches.map(l => `<tr><td class="text-mono" style="white-space: nowrap;">${l.days}</td><td>${l.meal}</td></tr>`).join('')}</tbody></table>
            </div>
            <div class="card" style="background: var(--black); color: var(--white);">
                <div class="card-header"><div class="card-title">🍽️ Dinners — Week ${week}</div></div>
                <table style="margin: 0;"><thead><tr><th style="background: var(--gray-800);">Day</th><th style="background: var(--gray-800);">Dinner</th></tr></thead><tbody>${data.dinners.map((d, i) => `<tr style="${i % 2 === 0 ? 'background: var(--gray-800);' : ''}"><td class="text-mono" style="color: var(--red);">${d.day}</td><td style="color: var(--white);">${d.meal}</td></tr>`).join('')}</tbody></table>
                ${week === 4 ? '<p style="margin: var(--spacing-md) 0 0; font-size: 12px; opacity: 0.7; text-align: center;">← Then repeat Week 1! →</p>' : ''}
            </div>
        </div>`;
}

function showMealWeek(week) {
    const container = document.getElementById('mealWeekDetails');
    if (!container) return;
    document.querySelectorAll('#nutrition .week-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    showMealWeekDirect(week);
}

function getMealWeekData(week) {
    return MEAL_ROTATION[week];
}

function getRaceProtocols() {
    return {
        1: { name: 'Absa RUN YOUR CITY Tshwane 10K', goal: 'Sub-60 minutes', focus: 'Learn the race experience', start: '3:30am', pace: '6:00/km average' },
        2: { name: 'Brooklyn Road Race 10K', goal: 'Sub-52 minutes', focus: 'Run smoother and faster', start: '3:00am', pace: '5:12-5:28/km' },
        3: { name: 'Sappi Tuks Night Race 5K', goal: 'Sub-22 minutes', focus: 'Practice controlled speed', start: 'late afternoon', pace: '4:24/km' },
        4: { name: 'Ford 3-in-1 Half Marathon', goal: '1:58-2:03', focus: 'Controlled half marathon rehearsal', start: 'early morning', pace: '5:35-5:50/km' },
        5: { name: 'Soweto Marathon 21.1km', goal: '1:50-1:55', focus: 'Race the plan and finish strong', start: 'early morning', pace: '5:12-5:28/km' }
    };
}

function showRaceProtocol(raceNum) {
    const container = document.getElementById('raceProtocolDetails');
    if (!container) return;

    document.querySelectorAll('#races .week-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');

    const protocols = getRaceProtocols();
    const race = protocols[raceNum] || protocols[1];

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">${race.name}</div>
                <div class="card-badge">${race.goal}</div>
            </div>
            <p><strong>Focus:</strong> ${race.focus}<br><strong>Start:</strong> ${race.start}<br><strong>Target Pace:</strong> ${race.pace}</p>
            <h3>Protocol</h3>
            <ul style="margin: 0;">
                <li>Arrive early and keep the warm-up calm.</li>
                <li>Start controlled, then settle into target pace.</li>
                <li>Use the final third of the race to finish strong.</li>
            </ul>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', function() {
    updateDynamicStats();
    drawWeightChart();
    updateRaceCountdown();
    updateChallengeDisplay();
    setInterval(updateDynamicStats, 60000);

    setTimeout(() => {
        if (document.getElementById('nutrition') && document.getElementById('nutrition').classList.contains('active')) {
            showMealWeekDirect(1);
        }
        if (document.getElementById('races') && document.getElementById('races').classList.contains('active')) {
            showRaceProtocol(1);
        }
    }, 300);
});