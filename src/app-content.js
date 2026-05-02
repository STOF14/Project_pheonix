// ===== MEAL ROTATION DATA =====
        const MEAL_ROTATION = window.ProjectPhoenixData.mealRotation;

        // ===== 75-DAY CHALLENGE TRACKER =====
        const CHALLENGE_START = new Date('2026-02-15');
        const CHALLENGE_REQUIREMENTS = ['workout', 'water', 'clean_eating', 'bible', 'photo', 'strava', 'recovery'];

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
            // Update checklist count in daily checklist section
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

            // Current challenge day (calendar days since start)
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

            // Update checklist streak display
            const streakEl = document.getElementById('checklistStreak');
            if (streakEl) streakEl.textContent = completedCount;

            const cdEl = document.getElementById('checklistChallengeDay');
            if (cdEl) cdEl.textContent = daysSinceStart < 0 ? '-' : calendarDay;

            // Draw grid
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

                let bg = isComplete ? '#000' : (isToday ? '#FF0000' : '#F5F5F5');
                let color = isComplete ? '#fff' : (isToday ? '#fff' : '#BDBDBD');
                let border = isPenalty ? '2px solid #FF0000' : '1px solid #E0E0E0';

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

        // ===== TRAINING TRACKING SYSTEM =====
        // TRAINING START DATE
        const TRAINING_START = new Date('2026-02-15');
        const SOWETO_RACE = new Date('2026-11-29');
        
        // RACE DATES
        const RACES = [
            { name: 'Tshwane 10K', date: new Date('2026-08-23'), distance: '10K' },
            { name: 'Brooklyn 10K', date: new Date('2026-09-05'), distance: '10K' },
            { name: 'Tuks 5K', date: new Date('2026-09-16'), distance: '5K' },
            { name: 'Ford Half', date: new Date('2026-09-26'), distance: '21.1K' },
            { name: 'SOWETO', date: new Date('2026-11-29'), distance: '21.1K' }
        ];

        // AUTO-DETECT CURRENT WEEK AND UPDATE STATS
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
                
                let total = parseInt(localStorage.getItem('totalWorkouts') || '0') + 1;
                localStorage.setItem('totalWorkouts', total.toString());
                if (document.getElementById('totalWorkouts')) {
                    document.getElementById('totalWorkouts').textContent = total;
                }
                
                updateStreak();
                updateWeekProgress();
                alert('Workout logged! Keep going!');
                document.getElementById('workoutCompleteButton').style.display = 'none';
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
            const padding = 40, chartWidth = canvas.width - padding * 2, chartHeight = canvas.height - padding * 2;
            
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
                document.getElementById('currentWeight').textContent = `${current}kg`;
                document.getElementById('totalLost').textContent = `${(95 - current).toFixed(1)}kg`;
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
            document.getElementById('raceTimelineOutput').innerHTML = html;
        }

        // Initialize all tracking on load
        document.addEventListener('DOMContentLoaded', function() {
            updateDynamicStats();
            drawWeightChart();
            updateRaceCountdown();
            setInterval(updateDynamicStats, 60000);
        });

        // ===== MEAL PLANNING =====
        // Meal Week Display Function
        function getMealWeekData(week) {
            return window.ProjectPhoenixData.mealRotation[week];
        }

        // Initialize meal week display
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                if (document.getElementById('nutrition') && document.getElementById('nutrition').classList.contains('active')) {
                    showMealWeek(1);
                }
                if (document.getElementById('races') && document.getElementById('races').classList.contains('active')) {
                    showRaceProtocol(1);
                }
            }, 300);
        });

        // Race Protocol Display Function
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

        // Navigation
        function showSection(sectionId) {
            // Hide all sections
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => section.classList.remove('active'));
            
            // Show selected section
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            // Update nav items - safely handle event
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => item.classList.remove('active'));
            
            // Find and activate the clicked nav item
            if (event && event.target) {
                const clickedNavItem = event.target.closest('.nav-item');
                if (clickedNavItem) {
                    clickedNavItem.classList.add('active');
                }
            }
            
            // Section-specific initializations
            if (sectionId === 'nutrition') {
                setTimeout(() => showMealWeekDirect(1), 50);
            }
            if (sectionId === 'challenge-tracker') {
                updateChallengeDisplay();
            }
            if (sectionId === 'checklist') {
                const checklistDateEl = document.getElementById('checklistDate');
                if (checklistDateEl) {
                    const today = new Date();
                    checklistDateEl.textContent = today.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
                }
                updateChallengeDisplay();
            }
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Close sidebar on mobile
            closeSidebar();
        }

        // Sidebar toggle (mobile)
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.querySelector('.overlay');
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        }

        function closeSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.querySelector('.overlay');
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }

        // Checkbox toggle
        function toggleCheck(checkbox) {
            checkbox.classList.toggle('checked');
        }

        // Search functionality
        function searchContent() {
            const input = document.getElementById('searchInput');
            const filter = input.value.toLowerCase();
            const sections = document.querySelectorAll('.content-section');
            
            if (filter === '') {
                return;
            }
            
            sections.forEach(section => {
                const text = section.textContent.toLowerCase();
                if (text.includes(filter)) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        }

        // Clear search on click outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-container')) {
                document.getElementById('searchInput').value = '';
                const sections = document.querySelectorAll('.content-section');
                sections.forEach(section => section.style.display = '');
            }
        });

        // Progress bar animation
        window.addEventListener('load', function() {
            const progressBars = document.querySelectorAll('.progress-bar');
            progressBars.forEach(bar => {
                const width = bar.getAttribute('data-width') || '0%';
                setTimeout(() => {
                    bar.style.width = width;
                }, 500);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
            // Escape to close sidebar
            if (e.key === 'Escape') {
                closeSidebar();
            }
        });

        // Week details function for Phase 1
        function showWeekDetails(weekNum) {

            const container = document.getElementById('weekDetailsContainer');
            if (!container) return;

            // Update active button
            document.querySelectorAll('.week-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            // Fetch and parse markdown for Phase 1
            fetch('03_Phase1_Foundation.md')
                .then(res => res.text())
                .then(md => {
                    // Use the same parser as in loadTodaysWorkout
                    const weekData = parsePhase1Markdown(md, weekNum);
                    if (!weekData) {
                        container.innerHTML = `<div class="info-box">No plan found for this week.</div>`;
                        return;
                    }
                    let html = `<h2>Week ${weekNum} Detailed Schedule</h2><div class="week-schedule">`;
                    weekData.forEach(dayObj => {
                        html += `<div class="day-card">
                            <div class="day-header"><span>${dayObj.day.toUpperCase()}</span></div>
                            <div class="day-detail">${marked.parse(dayObj.text)}</div>
                        </div>`;
                    });
                    html += '</div>';
                    container.innerHTML = html;
                    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                })
                .catch(() => {
                    container.innerHTML = `<div class="info-box">Could not load workout plan.</div>`;
                });
        }

        // Phase 2 Week Details
        function showPhase2Week(weekNum) {
            const container = document.getElementById('phase2WeekDetails');
            if (!container) return;

            document.querySelectorAll('#phase2 .week-btn').forEach(btn => btn.classList.remove('active'));
            if (event && event.target) event.target.classList.add('active');

            const weekData = getPhase2WeekData(weekNum);
            container.innerHTML = generateWeekHTML(weekNum, weekData);
            container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        function getPhase2WeekData(weekNum) {
            if (weekNum === 13) {
                return {
                    monday: { distance: 'REST', pace: '-', time: '-',
                        workout: 'Recovery Week - Complete Rest',
                        details: [
                            'You just completed 75+ consecutive days',
                            'Your body NEEDS rest',
                            'Complete rest OR 20-30min easy walks',
                            'No running, no gym',
                            'Focus: Sleep 9 hours, eat well, hydrate'
                        ]
                    },
                    tuesday: { distance: 'REST', pace: '-', time: '-',
                        workout: 'Recovery Week',
                        details: ['Continue rest protocol']
                    },
                    wednesday: { distance: 'REST', pace: '-', time: '-',
                        workout: 'Recovery Week',
                        details: ['Continue rest protocol']
                    },
                    thursday: { distance: '3km', pace: 'Easy', time: 'Flexible',
                        workout: 'Test the Legs',
                        details: ['Easy jog', 'Should feel fresh']
                    },
                    friday: { distance: '30min', pace: '-', time: 'Flexible',
                        workout: 'Light Mobility',
                        details: ['Gentle stretching', 'Foam rolling']
                    },
                    saturday: { distance: '6km', pace: 'Easy', time: '7:00am',
                        workout: 'Easy Run',
                        details: ['Conversational pace', 'Getting back into it']
                    },
                    sunday: { distance: 'REST', pace: '-', time: '-',
                        workout: 'Recovery Walk or Rest',
                        details: ['Final recovery day', 'Prepare for Phase 2']
                    }
                };
            } else {
                // Weeks 14-20 structure
                return {
                    monday: { distance: '8x800m', pace: '3:30-3:35', time: '6:00am',
                        workout: 'Speed Intervals',
                        details: [
                            'Warm-up: 2km easy + drills + 4x100m strides',
                            weekNum <= 15 ? '6 x 800m @ 3:35-3:40 (2min jog recovery)' : '8 x 800m @ 3:30-3:35 (90sec jog recovery)',
                            'This will feel HARD - you\'re building speed',
                            'Focus: Even pacing across all reps',
                            'Cool-down: 2km easy + 10min stretching',
                            'Evening: Complete rest (no gym)'
                        ]
                    },
                    tuesday: { distance: '6-8km', pace: '6:00-6:30/km', time: '6:00am',
                        workout: 'Easy Run',
                        details: [
                            'Conversational pace',
                            'Pure recovery from Monday intervals',
                            'Nose breathing test',
                            'Optional evening: Light stretching (20min)'
                        ]
                    },
                    wednesday: { distance: weekNum <= 15 ? '4km' : '6km', pace: weekNum <= 15 ? '5:00-5:15/km' : '4:50-5:05/km', time: '6:00am',
                        workout: 'Tempo Run',
                        details: [
                            'Warm-up: 2km easy jog',
                            weekNum <= 15 ? '4km @ 5:00-5:15/km (comfortably hard)' : '6km @ 4:50-5:05/km',
                            'Breathing: Can speak 3-5 words at a time',
                            'This is "comfortably uncomfortable"',
                            'Cool-down: 2km easy jog',
                            'Optional evening: Light upper body gym (30min) OR rest'
                        ]
                    },
                    thursday: { distance: '6km or REST', pace: 'Easy', time: '6:00am',
                        workout: 'Easy Run or Rest',
                        details: [
                            'Option A: 6km easy run (if feeling good)',
                            'Option B: Complete rest (if tired)',
                            'Option C: 30min bike/swim (cross-training)',
                            'Listen to your body - rest when needed'
                        ]
                    },
                    friday: { distance: '6-8km', pace: '6:00-6:30/km', time: '5:30am',
                        workout: 'Easy Run',
                        details: [
                            'Conversational pace',
                            'Prep for Saturday long run',
                            'Keep legs loose',
                            'Optional evening: Stretching/yoga (20-30min)'
                        ]
                    },
                    saturday: { distance: weekNum <= 15 ? '16-17km' : '18-20km', pace: '5:45-6:00/km easy', time: '7:00am',
                        workout: '🔥 Progressive Long Run',
                        details: [
                            'Light breakfast 90-120min before',
                            weekNum <= 15 ? 'First 12km @ 5:45-6:00/km (easy)' : 'First 13km @ 5:45-6:00/km (easy)',
                            weekNum <= 15 ? 'Last 4-5km @ 5:15-5:30/km (pick up pace)' : 'Last 5-7km @ 5:15-5:30/km',
                            'Practice negative splitting',
                            'Carry water for anything over 16km',
                            'Post-run: 5min walk, 500ml water, banana within 30min',
                            'Afternoon: Foam rolling + stretching (30min)'
                        ]
                    },
                    sunday: { distance: '5km or REST', pace: '7:00-7:30/km', time: 'Flexible',
                        workout: 'Recovery',
                        details: [
                            'Option A: Complete rest (recommended)',
                            'Option B: 5km very easy recovery jog',
                            'Option C: 45min walk in nature',
                            'No hard effort - focus on recovery'
                        ]
                    }
                };
            }
        }

        // Phase 3 Week Details
        function showPhase3Week(weekNum) {
            const container = document.getElementById('phase3WeekDetails');
            if (!container) return;

            document.querySelectorAll('#phase3 .week-btn').forEach(btn => btn.classList.remove('active'));
            if (event && event.target) event.target.classList.add('active');

            const weekData = getPhase3WeekData(weekNum);
            container.innerHTML = generateWeekHTML(weekNum, weekData);
            container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        function getPhase3WeekData(weekNum) {
            // Race weeks
            if (weekNum === 32 || weekNum === 35 || weekNum === 36) {
                return getRaceWeekData(weekNum);
            }
            
            // Regular training weeks
            let speedWork = '8 x 1km @ 4:10-4:15';
            if (weekNum >= 24 && weekNum <= 26) speedWork = '6 x 1.5km @ 4:15-4:20';
            if (weekNum >= 27 && weekNum <= 29) speedWork = '5 x 2km @ 4:20-4:25';
            if (weekNum >= 30 && weekNum <= 32) speedWork = '3 x 3km @ 4:25-4:30';
            if (weekNum >= 33) speedWork = '10 x 800m @ 3:25-3:30';

            let tempoDistance = '8km';
            let tempoPace = '4:45-5:00/km';
            if (weekNum >= 24 && weekNum <= 26) { tempoDistance = '10km'; tempoPace = '4:40-4:50/km'; }
            if (weekNum >= 27 && weekNum <= 29) { tempoDistance = '12km'; tempoPace = '4:35-4:45/km'; }
            if (weekNum >= 30 && weekNum <= 32) { tempoDistance = '10km'; tempoPace = '5:15-5:30/km'; }
            if (weekNum >= 33) { tempoDistance = '12-14km'; tempoPace = '5:15/km'; }

            let longRun = '18-19km';
            if (weekNum >= 24 && weekNum <= 26) longRun = '20-21km';
            if (weekNum >= 27 && weekNum <= 29) longRun = '22km';
            if (weekNum >= 30 && weekNum <= 31) longRun = '20km';
            if (weekNum === 33) longRun = '16km';
            if (weekNum === 34) longRun = '20km';

            return {
                monday: { distance: speedWork, pace: 'Intervals', time: '6:00am',
                    workout: 'Speed Intervals',
                    details: [
                        'Warm-up: 2km easy + dynamic drills + 4x100m strides',
                        speedWork + ' (90sec-2min jog recovery)',
                        'Cool-down: 2km easy + 10min stretching',
                        'Evening: Optional light strength if legs feel good'
                    ]
                },
                tuesday: { distance: '8km', pace: '6:00-6:30/km', time: '6:00am',
                    workout: 'Easy Run',
                    details: ['Pure recovery from speed work', 'Keep it easy and comfortable']
                },
                wednesday: { distance: tempoDistance, pace: tempoPace, time: '6:00am',
                    workout: '🔥 Tempo/Threshold Run',
                    details: [
                        '2km warm-up',
                        tempoDistance + ' @ ' + tempoPace,
                        weekNum >= 33 ? 'EXACTLY goal race pace - this proves your goal is achievable' : 'Building toward race pace',
                        '2km cool-down',
                        'This is your most important workout for half marathon success'
                    ]
                },
                thursday: { distance: '6-8km or REST', pace: 'Easy', time: '6:00am',
                    workout: 'Easy Run or Rest',
                    details: ['Listen to your body', 'Peak volume is stressful', 'Rest when needed']
                },
                friday: { distance: '6-8km', pace: '6:00-6:30/km', time: '5:30am',
                    workout: 'Easy Run',
                    details: ['Conversational pace', 'Prep for Saturday long run']
                },
                saturday: { distance: longRun, pace: 'Progressive', time: '7:00am',
                    workout: '🔥 Progressive Long Run',
                    details: [
                        'Light breakfast 90min before',
                        'First 13-16km easy (5:45-6:00/km)',
                        'Last 5-6km faster (5:00-5:30/km)',
                        longRun === '22km' ? 'LONGER THAN RACE DISTANCE - mental win!' : 'Building endurance',
                        'Carry water, consider energy gel at 60min',
                        'Post-run: Full recovery protocol'
                    ]
                },
                sunday: { distance: '5-6km or REST', pace: 'Easy', time: 'Flexible',
                    workout: 'Recovery',
                    details: ['Most weeks: complete rest recommended', 'Peak volume requires serious recovery']
                }
            };
        }

        function getRaceWeekData(weekNum) {
            const races = {
                32: { name: 'Absa Tshwane 10K', date: '23 AUG', goal: 'Sub-60min' },
                35: { name: 'Brooklyn 10K', date: '05 SEP', goal: 'Sub-52min' },
                36: { name: 'Tuks Night 5K', date: '16 SEP', goal: 'Sub-22min' }
            };
            const race = races[weekNum];

            return {
                monday: { distance: '6x800m', pace: '3:30', time: '6:00am',
                    workout: 'Speed Reminder',
                    details: ['Sharp but not exhausting', 'Just reminding legs of speed']
                },
                tuesday: { distance: '6km', pace: 'Easy', time: '6:00am',
                    workout: 'Easy Run',
                    details: ['Conversational pace', 'Keep it comfortable']
                },
                wednesday: { distance: weekNum === 36 ? 'RACE DAY' : '8km', pace: weekNum === 36 ? '-' : '5:00-5:15/km', time: weekNum === 36 ? '6:30pm' : '6:00am',
                    workout: weekNum === 36 ? '🔥 ' + race.name : 'Tempo',
                    details: weekNum === 36 ? [
                        'Goal: ' + race.goal,
                        'Night race on campus!',
                        'See Race Calendar for detailed strategy'
                    ] : ['Confidence builder - comfortably hard but not racing']
                },
                thursday: { distance: 'REST', pace: '-', time: '-',
                    workout: 'Complete Rest',
                    details: ['No running, no gym', 'Hydrate, sleep, mental prep']
                },
                friday: { distance: '3km', pace: 'Easy', time: '5:30am',
                    workout: 'Shakeout + Strides',
                    details: ['Easy jog + 6x100m strides', 'Loosen legs']
                },
                saturday: { distance: '2km or REST', pace: '-', time: 'Flexible',
                    workout: 'Shakeout or Rest',
                    details: ['Very easy jog OR complete rest', 'Your choice']
                },
                sunday: { distance: weekNum !== 36 ? 'RACE DAY' : 'REST', pace: '-', time: weekNum !== 36 ? '6:00am' : '-',
                    workout: weekNum !== 36 ? '🔥 ' + race.name : 'Post-Race Recovery',
                    details: weekNum !== 36 ? [
                        'Goal: ' + race.goal,
                        'See Race Calendar for detailed strategy',
                        'Execute your race plan!'
                    ] : ['Complete rest', 'Recovery from night race']
                }
            };
        }

        // Phase 4 Week Details
        function showPhase4Week(weekNum) {
            const container = document.getElementById('phase4WeekDetails');
            if (!container) return;

            document.querySelectorAll('#phase4 .week-btn').forEach(btn => btn.classList.remove('active'));
            if (event && event.target) event.target.classList.add('active');

            const weekData = getPhase4WeekData(weekNum);
            container.innerHTML = generateWeekHTML(weekNum, weekData);
            container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        function getPhase4WeekData(weekNum) {
            if (weekNum === 38) {
                return {
                    monday: { distance: 'REST', pace: '-', time: '-',
                        workout: 'Rest or Shakeout',
                        details: ['Complete rest OR 3km very easy jog']
                    },
                    tuesday: { distance: '6km', pace: 'Easy', time: '6:00am',
                        workout: 'Easy Run',
                        details: ['Conversational pace', 'Stay relaxed']
                    },
                    wednesday: { distance: '4km', pace: 'Easy', time: '6:00am',
                        workout: 'Easy + Strides',
                        details: ['4km easy', '4x100m strides', 'Shake out legs']
                    },
                    thursday: { distance: 'REST', pace: '-', time: '-',
                        workout: 'Complete Rest',
                        details: ['Hydrate, sleep, prepare mentally for race']
                    },
                    friday: { distance: '3km', pace: 'Easy', time: '5:30am',
                        workout: 'Shakeout + Strides',
                        details: ['3km easy', '4x100m strides', 'Loosen up']
                    },
                    saturday: { distance: 'RACE DAY', pace: '5:35-5:48/km', time: '6:00am',
                        workout: '🔥 FORD HALF MARATHON',
                        details: [
                            'Distance: 21.1km',
                            'Goal: 1:58-2:03 (80% effort)',
                            'This is DRESS REHEARSAL - NOT goal race',
                            'Test everything: breakfast, warm-up, pacing, gear',
                            'Learn what 21km feels like',
                            'See Race Calendar for detailed strategy'
                        ]
                    },
                    sunday: { distance: 'WALK', pace: '-', time: '9:00am',
                        workout: 'Recovery Walk Only',
                        details: ['No running', 'Gentle walking', 'Recover from race']
                    }
                };
            } else if (weekNum === 39) {
                return {
                    monday: { distance: '5-6km', pace: 'Easy', time: 'Flexible',
                        workout: 'Easy Run or Walk',
                        details: ['Post-race recovery week', 'Just moving gently']
                    },
                    tuesday: { distance: '5-6km', pace: 'Easy', time: 'Flexible',
                        workout: 'Easy Run or Walk',
                        details: ['Continue gentle recovery']
                    },
                    wednesday: { distance: '5-6km', pace: 'Easy', time: 'Flexible',
                        workout: 'Easy Run',
                        details: ['Let body recover from Ford race']
                    },
                    thursday: { distance: 'REST', pace: '-', time: '-',
                        workout: 'Rest',
                        details: ['Full recovery day']
                    },
                    friday: { distance: '6km', pace: 'Easy', time: '6:00am',
                        workout: 'Easy Run',
                        details: ['Getting back into it']
                    },
                    saturday: { distance: '14km', pace: 'Easy', time: '7:00am',
                        workout: 'Long Run',
                        details: ['Comfortable pace', 'Building back up']
                    },
                    sunday: { distance: 'REST', pace: '-', time: '-',
                        workout: 'Rest',
                        details: ['Final recovery day', 'Prepare for final peak weeks']
                    }
                };
            } else {
                // Weeks 37, 40, 41
                return {
                    monday: { distance: weekNum === 41 ? '8x800m' : '10x800m', pace: '3:25-3:30', time: '6:00am',
                        workout: 'Fast Intervals',
                        details: [
                            'Warm-up: 2km easy + drills + strides',
                            weekNum === 41 ? '8 x 800m @ 3:25' : '10 x 800m @ 3:25-3:30',
                            '90sec jog recovery',
                            weekNum === 41 ? 'Last hard speed before taper' : 'Sharp and fast but controlled',
                            'Cool-down: 2km easy + stretching'
                        ]
                    },
                    tuesday: { distance: '8km', pace: '6:00-6:30/km', time: '6:00am',
                        workout: 'Easy Run',
                        details: ['Recovery from Monday', 'Keep it comfortable']
                    },
                    wednesday: { distance: weekNum === 37 ? '10km' : (weekNum === 41 ? '14km' : '12km'), 
                                pace: weekNum === 37 ? '5:30/km' : '5:15/km', time: '6:00am',
                        workout: '🔥 Race Pace Tempo',
                        details: [
                            '2km warm-up',
                            weekNum === 37 ? '10km @ 5:30/km' : (weekNum === 41 ? '14km @ 5:15/km' : '12km @ 5:15/km'),
                            weekNum >= 40 ? 'EXACTLY goal race pace - proving you can do this!' : 'Building race pace confidence',
                            '2km cool-down',
                            'This workout proves your goal is achievable'
                        ]
                    },
                    thursday: { distance: '6km or REST', pace: 'Easy', time: '6:00am',
                        workout: 'Easy Run or Rest',
                        details: ['Listen to body', 'Peak training is demanding']
                    },
                    friday: { distance: '6-8km', pace: '6:00-6:30/km', time: '5:30am',
                        workout: 'Easy Run',
                        details: ['Prepare for Saturday long run', 'Conversational pace']
                    },
                    saturday: { distance: weekNum === 37 ? '20km' : (weekNum === 41 ? '18km' : '22-23km'), 
                                pace: 'Progressive', time: '7:00am',
                        workout: weekNum >= 39 && weekNum <= 40 ? '🔥 FINAL PEAK LONG RUN' : '🔥 Long Run',
                        details: [
                            'Light breakfast 90min before',
                            weekNum === 37 ? 'First 14km easy, last 6km @ 5:15-5:30/km' :
                            weekNum === 41 ? 'First 12km easy, last 6km @ 5:15/km' :
                            'First 16km easy, middle 4km @ 5:30/km, last 2-3km @ 5:00-5:15/km',
                            weekNum >= 39 && weekNum <= 40 ? 'YOUR LONGEST RUN EVER - 22-23km!' : '',
                            weekNum >= 39 && weekNum <= 40 ? 'Mental prep: If you can do 23km, 21km race is manageable' : '',
                            'Full recovery protocol after'
                        ]
                    },
                    sunday: { distance: '5km or REST', pace: 'Easy', time: 'Flexible',
                        workout: 'Recovery',
                        details: ['Most weeks: complete rest', 'Occasionally: very easy jog if feeling fresh']
                    }
                };
            }
        }

        // Phase 5 Week Details
        function showPhase5Week(weekNum) {
            const container = document.getElementById('phase5WeekDetails');
            if (!container) return;

            document.querySelectorAll('#phase5 .week-btn').forEach(btn => btn.classList.remove('active'));
            if (event && event.target) event.target.classList.add('active');

            const weekData = getPhase5WeekData(weekNum);
            container.innerHTML = generateWeekHTML(weekNum, weekData);
            container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        function getPhase5WeekData(weekNum) {
            if (weekNum === 42) {
                return {
                    monday: { distance: '6x800m', pace: '3:25', time: '6:00am',
                        workout: 'Speed Sharpener',
                        details: [
                            'Warm-up: 2km easy + drills + strides',
                            '6 x 800m @ 3:25',
                            'Feel sharp, not exhausted',
                            'Should feel easier than weeks ago',
                            'Cool-down: 2km easy + stretch'
                        ]
                    },
                    tuesday: { distance: '6km', pace: 'Easy', time: '6:00am',
                        workout: 'Easy Run',
                        details: ['Conversational pace', 'Just ticking over']
                    },
                    wednesday: { distance: '8km', pace: '5:15/km', time: '6:00am',
                        workout: 'Race Pace Run',
                        details: [
                            '2km warm-up',
                            '8km @ 5:15/km (goal race pace)',
                            'Last hard workout before race',
                            'Should feel controlled and confident',
                            '2km cool-down'
                        ]
                    },
                    thursday: { distance: 'REST', pace: '-', time: '-',
                        workout: 'Complete Rest',
                        details: ['No running, no gym', 'Sleep, hydrate, stretch', 'Mental preparation']
                    },
                    friday: { distance: '6km', pace: 'Easy', time: '5:30am',
                        workout: 'Easy Run',
                        details: ['Very comfortable', 'Just moving legs']
                    },
                    saturday: { distance: '16km', pace: '5:45-6:00/km', time: '7:00am',
                        workout: 'Last Long Run',
                        details: [
                            'ALL EASY PACE - don\'t push',
                            'Just time on feet',
                            'Practice pre-run routine',
                            'Practice during-run hydration',
                            'Final rehearsal for long distance'
                        ]
                    },
                    sunday: { distance: 'REST', pace: '-', time: '-',
                        workout: 'Complete Rest',
                        details: ['No running', 'Recovery walk optional', 'Mental prep for final two weeks']
                    }
                };
            } else if (weekNum === 43) {
                return {
                    monday: { distance: '5x400m', pace: '1:35', time: '6:00am',
                        workout: 'Fast Short Intervals',
                        details: [
                            'Warm-up: 2km + strides',
                            '5 x 400m @ 1:35',
                            'Very short - just reminding legs of speed',
                            'Should feel easy and sharp',
                            'Cool-down: 2km + stretch'
                        ]
                    },
                    tuesday: { distance: '6km', pace: 'Easy', time: '6:00am',
                        workout: 'Easy Run',
                        details: ['Comfortable pace', 'Feeling good']
                    },
                    wednesday: { distance: '6km', pace: 'Easy', time: '6:00am',
                        workout: 'Easy + Strides',
                        details: ['Very easy run', '4x100m strides to keep legs sharp', 'Shake out any tightness']
                    },
                    thursday: { distance: 'REST', pace: '-', time: '-',
                        workout: 'Complete Rest',
                        details: ['Full recovery day', 'Sleep, hydrate, relax']
                    },
                    friday: { distance: '5km', pace: 'Easy', time: '5:30am',
                        workout: 'Easy Run',
                        details: ['Very comfortable', 'Just moving']
                    },
                    saturday: { distance: '10km', pace: 'Easy', time: '7:00am',
                        workout: 'Easy Run',
                        details: ['ALL easy pace', 'Conversational', 'Just keeping legs used to running']
                    },
                    sunday: { distance: '3km or REST', pace: 'Easy', time: 'Flexible',
                        workout: 'Shakeout or Rest',
                        details: ['If legs tight: 3km easy', 'If legs good: complete rest', 'Your choice based on feel']
                    }
                };
            } else { // Week 44 - RACE WEEK
                return {
                    monday: { distance: '5x400m', pace: '1:35', time: '6:00am',
                        workout: 'Speed Reminder',
                        details: [
                            '6 DAYS OUT',
                            'Warm-up: 2km + strides',
                            '5 x 400m @ 1:35',
                            'Fast, short, sharp',
                            'Should feel effortless',
                            'Cool-down: 2km',
                            'Evening: Hydrate well (start building hydration)'
                        ]
                    },
                    tuesday: { distance: '6km', pace: 'Easy', time: '6:00am',
                        workout: 'Easy Run',
                        details: [
                            '5 DAYS OUT',
                            'Very comfortable pace',
                            'No watch needed - just moving',
                            'Evening: Light stretching, normal routine, early to bed'
                        ]
                    },
                    wednesday: { distance: '6km', pace: 'Easy', time: '6:00am',
                        workout: 'Easy + Strides',
                        details: [
                            '4 DAYS OUT',
                            'Shake out legs',
                            '4x100m strides to feel sharp',
                            'Should feel good',
                            'Evening: Foam rolling, visualization, early to bed'
                        ]
                    },
                    thursday: { distance: 'REST', pace: '-', time: '-',
                        workout: '🔥 COMPLETE REST',
                        details: [
                            '3 DAYS OUT',
                            'No running, no gym, no hard activity',
                            'Sleep 8-9 hours',
                            'Hydrate well (3-4L water)',
                            'Eat normal meals',
                            'Stretch gently (20min)',
                            'Mental prep - visualization',
                            'Organize race day logistics'
                        ]
                    },
                    friday: { distance: '3km', pace: 'Easy', time: '5:30am',
                        workout: 'Shakeout + Strides',
                        details: [
                            '2 DAYS OUT',
                            'VERY easy - just loosening legs',
                            '4x100m strides @ 80%',
                            'Keep legs feeling sharp',
                            'Total: 20min max',
                            'Evening: Pack race bag, review plan, early to bed (9pm)'
                        ]
                    },
                    saturday: { distance: 'REST', pace: '-', time: 'All day',
                        workout: '🔥 CARB LOADING DAY',
                        details: [
                            '1 DAY OUT',
                            'COMPLETE REST or 2km easy jog if stiff',
                            'NO OTHER EXERCISE',
                            'CARB LOADING: Pancakes, rice, pasta (see nutrition section)',
                            'Reduce fiber, avoid new foods',
                            '3-4L water (stop at 9pm)',
                            'Foam rolling, stretching, rest',
                            'Lay out EVERYTHING for race',
                            'SET 3 ALARMS for 4am',
                            'BED BY 9PM SHARP'
                        ]
                    },
                    sunday: { distance: '21.1KM', pace: '5:12-5:28/km', time: '7:00am',
                        workout: '🔥🔥🔥 SOWETO MARATHON',
                        details: [
                            'RACE DAY - 280 DAYS LED TO THIS',
                            'Goal: 1:50-1:55',
                            'Wake: 4:00am',
                            'Breakfast: 4:15am (tested from Ford)',
                            'Arrive venue: 6:00am',
                            'Warm-up: 6:15am',
                            'Start line: 6:45am',
                            'RACE START: 7:00am',
                            'KM 0-5: 5:30-5:40/km (disciplined start)',
                            'KM 5-10: 5:20-5:28/km (settle into pace)',
                            'KM 10-15: 5:15-5:22/km (prove training)',
                            'KM 15-18: 5:12-5:18/km (the grind)',
                            'KM 18-20: 5:10-5:15/km (dig deep)',
                            'KM 20-21.1: ALL-OUT SPRINT FINISH',
                            'EXECUTE. TRUST. FINISH. 🔥'
                        ]
                    }
                };
            }
        }

        // Helper function to generate week HTML
        function generateWeekHTML(weekNum, weekData) {
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            
            let html = `<h2>Week ${weekNum} Detailed Schedule</h2>`;
            
            days.forEach((day, index) => {
                const dayData = weekData[day];
                html += `
                    <div class="workout-detail-card">
                        <div class="workout-detail-header">
                            <div class="workout-detail-day">${dayNames[index]}</div>
                            <div class="workout-detail-badge">${dayData.distance}</div>
                        </div>
                        <div class="workout-detail-body">
                            <h3 style="margin-top: 0;">${dayData.workout}</h3>
                            ${dayData.time !== '-' ? `<p class="text-mono"><strong>Time:</strong> ${dayData.time} | <strong>Pace:</strong> ${dayData.pace}</p>` : ''}
                            <div class="workout-section">
                                <div class="workout-section-title">Workout Details</div>
                                ${dayData.details.map(detail => `
                                    <div class="workout-instruction">
                                        <span class="workout-instruction-icon">→</span>
                                        <span>${detail}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            return html;
        }

        // Helper functions to get workout data for Today's Workout
        function getPhase1Workout(week, day) {
            const weekData = week === 12 ? {
                monday: { distance: 'REST', pace: '-', time: '-',
                    workout: 'Complete Rest or Easy Walk',
                    details: ['YOU JUST COMPLETED 75 CONSECUTIVE DAYS! 🎉', 'Complete rest OR 20-30min easy walks only']
                }
            } : {
                monday: { distance: '3km', pace: '7:15-7:30/km', time: '6:00am', 
                    workout: 'Easy Run + Hamstring Circuit',
                    details: ['Easy run', 'Evening: Nordic Curls Circuit']
                }
            };
            return weekData[day];
        }

        function getPhase2Workout(week, day) {
            return getPhase2WeekData(week)[day];
        }

        function getPhase3Workout(week, day) {
            return getPhase3WeekData(week)[day];
        }

        function getPhase4Workout(week, day) {
            return getPhase4WeekData(week)[day];
        }

        function getPhase5Workout(week, day) {
            return getPhase5WeekData(week)[day];
        }
        function loadTodaysWorkoutLegacy() {
            const phase = document.getElementById('phaseSelect').value;
            const week = parseInt(document.getElementById('weekSelect').value);
            const container = document.getElementById('todaysWorkoutContent');
            
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const currentDay = days[dayOfWeek];
            const currentDayName = dayNames[dayOfWeek];
            
            // For now, only Phase 1 is implemented
            if (phase === 'phase1') {
                const weekData = {
                    1: {
                        monday: { distance: '3km', pace: '7:15-7:30/km', time: '6:00am', 
                            workout: 'Easy Run + Hamstring Circuit',
                            details: [
                                '5min walk cool-down',
                                'Stretch: Hamstrings, quads, calves, hip flexors (30sec each)',
                                'Evening 21:00 - Nordic Curls Circuit (20-25min)',
                                'Warm-up: Leg swings, bodyweight squats, glute bridges',
                                'Nordic Curls: 3 sets x 3-4 reps (5sec eccentric)',
                                'Single-Leg RDLs: 3 sets x 8 reps per leg',
                                'Glute Bridges: 3 sets x 15 reps',
                                'Plank Hold: 3 sets x 30-45sec',
                                'Dead Bugs: 3 sets x 12 reps'
                            ]
                        },
                        tuesday: { distance: '30-45min', pace: 'Walk', time: '6:00am',
                            workout: 'Recovery Walk + Optional Gym',
                            details: [
                                'Around campus, Hatfield streets',
                                'Easy conversational pace (4-5km/hr)',
                                'Optional Evening 17:30 - Light Strength (30-40min)',
                                'Warm-up: 500m easy rowing',
                                'Pull-ups: 3x6-8 (assisted if needed)',
                                'Dumbbell Bench Press: 3x10',
                                'Single-Arm Rows: 3x10 per arm',
                                'Goblet Squats (LIGHT): 3x12',
                                'Core: Hanging knee raises, pallof press, side planks'
                            ]
                        },
                        wednesday: { distance: '3km', pace: '7:00-7:15/km', time: '5:30am',
                            workout: 'Easy Run + Strides + Mobility',
                            details: [
                                'Then add 4 x 100m strides @ 70% effort',
                                'Strides: Gradual build, hold 60m, decelerate',
                                'Walk back recovery (1-2min)',
                                'Optional Evening 17:45 - Mobility Session (30-40min)',
                                'Yoga Flow: Sun salutations (5 rounds)',
                                'Warrior poses, triangle pose, pigeon pose',
                                'Foam Rolling: Quads, hamstrings, calves, IT band (15min)'
                            ]
                        },
                        thursday: { distance: '30-45min', pace: 'Easy', time: '6:00am',
                            workout: 'Recovery Walk OR Very Easy Jog',
                            details: [
                                'Option A: 45min easy walking pace',
                                'Option B: 4-5km VERY easy jog (7:00-7:30/km)',
                                'Choose based on how body feels',
                                'Should feel absolutely effortless',
                                'Optional evening: Light bodyweight circuit (20min)'
                            ]
                        },
                        friday: { distance: '3km', pace: '7:15/km', time: '5:30am',
                            workout: 'Easy Run',
                            details: [
                                'Keep it conversational and comfortable',
                                'Optional Evening - Stretching/mobility (20min)',
                                'Light core work (planks, dead bugs)',
                                'Foam rolling'
                            ]
                        },
                        saturday: { distance: '5km', pace: '7:00-7:30/km', time: '7:00am',
                            workout: '🔥 LONG RUN - MOST IMPORTANT',
                            details: [
                                'Go SLOW - conversational pace throughout',
                                'Walk breaks allowed if needed',
                                'Eat light breakfast 90min before: Oats + banana OR toast + jam',
                                'Target time: 35-37min',
                                'Post-run: 5min walk, stretch 10min',
                                'Afternoon 16:00 - Recovery Protocol (45min)',
                                'Option A: Foam rolling + deep stretching',
                                'Option B: Swimming (easy laps)',
                                'Option C: Ice bath + foam rolling'
                            ]
                        },
                        sunday: { distance: '45min', pace: 'Walk', time: '9:00am',
                            workout: 'Recovery Walk - COMPLETE REST',
                            details: [
                                'NO RUNNING on Sundays',
                                'Easy walking pace (no rushing)',
                                'Ideal: Nature setting (Botanical Gardens)',
                                'Optional Evening 18:00 - Mobility + Meditation (30-40min)',
                                'Hip Mobility Circuit: 90/90 transitions, couch stretch, frog stretch',
                                'Light Core Work: Dead bugs, planks, bird dogs',
                                'Meditation + Breathing: Box breathing (5min), body scan'
                            ]
                        }
                    },
                    12: {
                        monday: { distance: 'REST', pace: '-', time: '-',
                            workout: 'Complete Rest or Easy Walk',
                            details: [
                                'YOU JUST COMPLETED 75 CONSECUTIVE DAYS! 🎉',
                                'Complete rest OR 20-30min easy walks only',
                                'No running, no gym',
                                'Focus: Sleep 9 hours, eat well, hydrate'
                            ]
                        }
                    }
                };
                
                const weekWorkouts = weekData[week] || weekData[1];
                const dayWorkout = weekWorkouts[currentDay];
                
                container.innerHTML = `
                    <div class="workout-detail-card">
                        <div class="workout-detail-header">
                            <div class="workout-detail-day">${currentDayName} - Week ${week}</div>
                            <div class="workout-detail-badge">${dayWorkout.distance}</div>
                        </div>
                        <div class="workout-detail-body">
                            <h3 style="margin-top: 0; color: var(--red);">${dayWorkout.workout}</h3>
                            ${dayWorkout.time !== '-' ? `<p class="text-mono" style="font-size: 16px; margin-bottom: var(--spacing-lg);"><strong>Time:</strong> ${dayWorkout.time} | <strong>Pace:</strong> ${dayWorkout.pace}</p>` : ''}
                            <div class="workout-section">
                                <div class="workout-section-title">Workout Breakdown</div>
                                ${dayWorkout.details.map(detail => `
                                    <div class="workout-instruction">
                                        <span class="workout-instruction-icon">→</span>
                                        <span>${detail}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="card" style="margin-top: var(--spacing-lg); background: var(--black); color: var(--white);">
                        <div class="card-title">75 To Runner Checklist</div>
                        <p style="margin: 0; font-size: 13px;">Don't forget to complete all daily requirements:</p>
                        <ul style="margin: var(--spacing-sm) 0 0 0; font-size: 13px;">
                            <li>✓ This workout (45min+)</li>
                            <li>✓ 1 gallon water (3.8L)</li>
                            <li>✓ No junk food / No takeaways</li>
                            <li>✓ Bible reading (~4 chapters)</li>
                            <li>✓ Progress photo</li>
                            <li>✓ Log in Strava</li>
                        </ul>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="info-box">
                        <div class="info-box-title">Coming Soon</div>
                        <p style="margin: 0;">Detailed workouts for Phase 2-5 are available in their respective sections. Select Phase 1 to see full workout breakdowns.</p>
                    </div>
                `;
            }
        }

        // Save checklist state to localStorage with daily reset
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize meal rotation default view
            setTimeout(() => { 
                if (document.getElementById('mealWeekDetails')) {
                    const fakeEvent = { target: document.querySelector('#nutrition .week-btn') };
                    showMealWeekDirect(1);
                }
                updateChallengeDisplay();
                updateChecklistCount();
                // Initialize checklist date
                const checklistDateEl = document.getElementById('checklistDate');
                if (checklistDateEl) {
                    const today = new Date();
                    checklistDateEl.textContent = today.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
                }
            }, 100);
            
            // Get today's date as a string (YYYY-MM-DD)
            const today = new Date().toISOString().split('T')[0];
            const savedDate = localStorage.getItem('checklist-date');
            
            // If it's a new day, clear all checkboxes
            if (savedDate !== today) {
                localStorage.setItem('checklist-date', today);
                // Clear all previous checkbox states
                const allKeys = Object.keys(localStorage);
                allKeys.forEach(key => {
                    if (key.startsWith('checkbox-')) {
                        localStorage.removeItem(key);
                    }
                });
            }
            
            // Load checkbox states
            const checkboxes = document.querySelectorAll('.checkbox');
            checkboxes.forEach((checkbox, index) => {
                const saved = localStorage.getItem(`checkbox-${index}`);
                if (saved === 'checked') {
                    checkbox.classList.add('checked');
                }
                
                // Save state on click
                checkbox.addEventListener('click', function() {
                    const isChecked = this.classList.contains('checked');
                    localStorage.setItem(`checkbox-${index}`, isChecked ? 'checked' : '');
                });
            });
            
            // Display current date and day count
            updateDateDisplay();
        });
        
        function logRunTime() {
            const distance = document.getElementById('runDistance').value;
            const time = document.getElementById('runTime').value;
            const week = document.getElementById('runWeek').value;
            if (!time || !week) { alert('Enter time and week number'); return; }
            
            const runs = JSON.parse(localStorage.getItem('runTimes') || '[]');
            runs.push({ distance, time, week: parseInt(week), date: new Date().toISOString().split('T')[0] });
            runs.sort((a, b) => a.week - b.week);
            localStorage.setItem('runTimes', JSON.stringify(runs));
            
            document.getElementById('runTime').value = '';
            document.getElementById('runWeek').value = '';
            displayRunTimes();
            alert(`Week ${week} ${distance}: ${time} logged! 🏃`);
        }

        function displayRunTimes() {
            const container = document.getElementById('runTimeHistory');
            const pbContainer = document.getElementById('runTimePBs');
            if (!container) return;

            const runs = JSON.parse(localStorage.getItem('runTimes') || '[]');
            if (!runs.length) {
                container.innerHTML = '<p style="color: var(--gray-300);">No times logged yet. Complete your first time trial and log it above.</p>';
                if (pbContainer) pbContainer.innerHTML = '';
                return;
            }

            container.innerHTML = `
                <table style="margin: 0; font-family: 'IBM Plex Mono', monospace;">
                    <thead><tr><th>Week</th><th>Distance</th><th>Time</th><th>Date</th></tr></thead>
                    <tbody>
                        ${runs.map(r => `<tr><td>Wk ${r.week}</td><td>${r.distance}</td><td style="color: var(--red); font-weight: 700;">${r.time}</td><td>${r.date}</td></tr>`).join('')}
                    </tbody>
                </table>
            `;

            // Calculate PBs
            const pbs = {};
            runs.forEach(r => {
                if (!pbs[r.distance] || r.time < pbs[r.distance]) pbs[r.distance] = r.time;
            });
            if (pbContainer) {
                pbContainer.innerHTML = Object.entries(pbs).map(([dist, time]) => `
                    <div>
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${dist} PB</div>
                        <div style="font-size: 24px; font-weight: 900; color: var(--red); margin-top: 4px;">${time}</div>
                    </div>
                `).join('');
            }
        }

        // Load run times on progress section init
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => displayRunTimes(), 200);
        });

        // Function to update date display
    function updateDateDisplay() {
            const today = new Date();
            const startDate = new Date('2026-02-15');
            const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
            
            // Update current date in banner
            const currentDateEl = document.getElementById('currentDate');
            if (currentDateEl) {
                const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
                currentDateEl.textContent = today.toLocaleDateString('en-US', options);
            }
            
            // Update stats if elements exist
            const statValue = document.querySelector('.stat-value');
            if (statValue && daysDiff >= 0 && daysDiff <= 280) {
                // You could add a day counter here if needed
            }
        }

