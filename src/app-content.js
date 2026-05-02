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

