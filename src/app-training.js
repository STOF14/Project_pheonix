const PHASE_CONFIG = window.ProjectPhoenixData.phaseConfig;

const markdownCache = new Map();
const weekSectionCache = new Map();
const completionStorageKey = 'weekCompletionV1';

let currentPhaseFile = '03_Phase1_Foundation.md';
let currentWeekNum = 1;

function getCompletionMap() {
    return window.ProjectPhoenixUtils.getStoredJson(completionStorageKey, {});
}

function setCompletionMap(data) {
    window.ProjectPhoenixUtils.setStoredJson(completionStorageKey, data);
}

function completionKey(phaseFile, weekNum, dayName) {
    return `${phaseFile}|${weekNum}|${String(dayName || '').toLowerCase()}`;
}

function isDayCompleted(phaseFile, weekNum, dayName) {
    const map = getCompletionMap();
    return !!map[completionKey(phaseFile, weekNum, dayName)];
}

function setDayCompleted(phaseFile, weekNum, dayName, completed) {
    const map = getCompletionMap();
    const key = completionKey(phaseFile, weekNum, dayName);
    if (completed) map[key] = true;
    else delete map[key];
    setCompletionMap(map);
}

function updateStickyBar() {
    const bar = document.getElementById('todayStickyBar');
    if (!bar) return;
    const label = weekTitleForPhase(currentPhaseFile, currentWeekNum).toUpperCase();
    bar.textContent = `WEEK CONTEXT: ${label}`;
}

function getTodayModeEnabled() {
    const el = document.getElementById('todayModeToggle');
    return !!(el && el.checked);
}

function getTrainingState() {
    const el = document.getElementById('trainingState');
    return (el && el.value) || 'on-plan';
}

function applyTrainingStateAdjustments(dayBlocks, state) {
    if (!Array.isArray(dayBlocks)) return [];
    return dayBlocks.map(day => {
        if (!day || !day.markdown) return day;
        let markdown = day.markdown;
        if (state === 'catch-up') {
            markdown += '\n\n- Catch-up focus: keep effort controlled and prioritize consistency over intensity.';
        }
        if (state === 'deload') {
            markdown += '\n\n- Deload override: reduce intensity by 20-30% and keep this session conversational.';
        }
        return { ...day, markdown };
    });
}

function weekSummaryFromDays(dayBlocks, weekNum) {
    const structured = dayBlocks.map(day => extractStructuredDay(day, weekNum));
    const kmValues = structured
        .map(day => {
            const m = String(day.distance || '').match(/(\d+(?:\.\d+)?)\s?km/i);
            return m ? parseFloat(m[1]) : 0;
        })
        .filter(v => Number.isFinite(v) && v > 0);
    const weeklyKm = kmValues.reduce((sum, v) => sum + v, 0);
    const longRun = kmValues.length ? Math.max(...kmValues) : 0;
    const keyWorkout = structured.find(day => /tempo|speed|interval|race/i.test(String(day.workout || '')));
    return {
        weeklyKm,
        longRun,
        keyWorkout: keyWorkout ? `${keyWorkout.day}: ${keyWorkout.workout}` : 'Consistency block',
        recovery: 'Sleep + hydration + mobility'
    };
}

function renderWeeklySummaryStrip(dayBlocks, weekNum) {
    const el = document.getElementById('weeklySummaryStrip');
    if (!el) return;
    const summary = weekSummaryFromDays(dayBlocks, weekNum);
    el.innerHTML = `
        WEEK SUMMARY: <strong>${Math.round(summary.weeklyKm)}KM TARGET</strong> •
        LONG RUN: <strong>${summary.longRun || 0}KM</strong> •
        KEY: <strong>${summary.keyWorkout.toUpperCase()}</strong> •
        RECOVERY: <strong>${summary.recovery.toUpperCase()}</strong>
    `;
}

function updateCompletionUI(phaseFile, weekNum) {
    const label = document.getElementById('completionLabel');
    const fill = document.getElementById('weekCompletionFill');
    if (!label || !fill) return;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const done = days.filter(day => isDayCompleted(phaseFile, weekNum, day)).length;
    const pct = Math.round((done / days.length) * 100);
    label.textContent = `Week Completion: ${done}/7 (${pct}%)`;
    fill.style.width = `${pct}%`;
}

function bindCompletionHandlers(container, phaseFile, weekNum) {
    const toggles = container.querySelectorAll('.day-complete-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const day = this.getAttribute('data-day');
            setDayCompleted(phaseFile, weekNum, day, this.checked);
            updateCompletionUI(phaseFile, weekNum);
        });
    });
}

async function fetchMarkdownCached(phaseFile) {
    if (markdownCache.has(phaseFile)) return markdownCache.get(phaseFile);
    const response = await fetch(phaseFile);
    if (!response.ok) throw new Error('Failed to fetch phase markdown');
    const markdown = await response.text();
    markdownCache.set(phaseFile, markdown);
    return markdown;
}

function getWeekSectionCached(markdown, phaseFile, weekNum) {
    const key = `${phaseFile}|${weekNum}`;
    if (weekSectionCache.has(key)) return weekSectionCache.get(key);
    const section = extractWeekSection(markdown, phaseFile, weekNum);
    weekSectionCache.set(key, section);
    return section;
}

function renderTodayOnly(dayBlocks, weekNum, todayName) {
    const todayBlock = dayBlocks.find(day => String(day.day || '').toLowerCase() === String(todayName).toLowerCase());
    const fallback = todayBlock || dayBlocks[0] || { day: todayName, markdown: `### ${todayName}\n\n- No session listed.` };
    return renderWeekCards([fallback], {
        detailed: true,
        todayName,
        weekNum,
        fullWeek: false,
        phaseFile: currentPhaseFile
    });
}

function evaluateFatigueRisk() {
    const sleep = parseFloat((document.getElementById('sleepHours') || {}).value || '0');
    const soreness = parseInt((document.getElementById('sorenessScore') || {}).value || '0', 10);
    const stress = parseInt((document.getElementById('stressScore') || {}).value || '0', 10);
    const target = document.getElementById('fatigueAdvice');
    if (!target) return;

    let risk = 0;
    if (sleep < 6) risk += 2;
    if (soreness >= 7) risk += 2;
    if (stress >= 7) risk += 2;
    if (sleep >= 6 && sleep < 7) risk += 1;
    if (soreness >= 5 && soreness < 7) risk += 1;
    if (stress >= 5 && stress < 7) risk += 1;

    if (risk >= 5) {
        target.textContent = 'High fatigue risk: swap hard session for 30-40 min easy + mobility.';
        target.style.color = 'var(--red)';
        return;
    }
    if (risk >= 3) {
        target.textContent = 'Moderate fatigue risk: cut volume 20% and keep effort easy-to-moderate.';
        target.style.color = 'var(--gray-800)';
        return;
    }
    target.textContent = 'Low fatigue risk: proceed as planned and keep recovery habits tight.';
    target.style.color = 'var(--gray-800)';
}

function getActiveWeekFromSection(sectionSelector, fallbackWeek) {
    const active = document.querySelector(`${sectionSelector} .week-btn.active`);
    if (!active) return fallbackWeek;
    const match = active.textContent.match(/Week\s+(\d+)/i);
    return match ? parseInt(match[1], 10) : fallbackWeek;
}

function attachSwipeNavigation(containerId, minWeek, maxWeek, onChange, getCurrentWeek) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let startX = 0;
    let deltaX = 0;
    container.addEventListener('touchstart', function(e) {
        startX = e.changedTouches[0].clientX;
        deltaX = 0;
    }, { passive: true });
    container.addEventListener('touchmove', function(e) {
        deltaX = e.changedTouches[0].clientX - startX;
    }, { passive: true });
    container.addEventListener('touchend', function() {
        if (Math.abs(deltaX) < 40) return;
        const baseWeek = typeof getCurrentWeek === 'function' ? getCurrentWeek() : currentWeekNum;
        let nextWeek = baseWeek;
        if (deltaX < 0) nextWeek += 1;
        if (deltaX > 0) nextWeek -= 1;
        if (nextWeek < minWeek || nextWeek > maxWeek) return;
        currentWeekNum = nextWeek;
        onChange(nextWeek);
    });
}

function ensureUpdateToast() {
    let toast = document.getElementById('updateToast');
    if (toast) return toast;
    toast = document.createElement('div');
    toast.id = 'updateToast';
    toast.className = 'update-toast';
    toast.innerHTML = '<div class="text-mono" style="font-size:12px;">New plan update is ready.</div><button id="applyUpdateBtn">Refresh App</button>';
    document.body.appendChild(toast);
    const btn = document.getElementById('applyUpdateBtn');
    if (btn) {
        btn.addEventListener('click', function() {
            window.location.reload();
        });
    }
    return toast;
}

function showUpdateToast() {
    const toast = ensureUpdateToast();
    toast.style.display = 'block';
}

window.showUpdateToast = showUpdateToast;

function getSelectedWeek() {
    return parseInt(document.getElementById('weekSelect').value, 10);
}

function getSelectedPhaseFile() {
    return document.getElementById('phaseSelect').value;
}

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isHeading(line) {
    return /^#{1,6}\s+/.test(line);
}

function headingLevel(line) {
    const match = line.match(/^(#{1,6})\s+/);
    return match ? match[1].length : null;
}

function findHeadingSection(md, headingPattern) {
    const lines = md.split('\n');
    const pattern = headingPattern instanceof RegExp ? headingPattern : new RegExp(headingPattern, 'i');

    let start = -1;
    for (let i = 0; i < lines.length; i += 1) {
        if (pattern.test(lines[i])) {
            start = i;
            break;
        }
    }
    if (start === -1) return '';

    const startLevel = headingLevel(lines[start]) || 2;
    let end = lines.length;
    for (let j = start + 1; j < lines.length; j += 1) {
        if (isHeading(lines[j])) {
            const lvl = headingLevel(lines[j]);
            if (lvl && lvl <= startLevel) {
                end = j;
                break;
            }
        }
    }

    return lines.slice(start, end).join('\n').trim();
}

function combineSections(parts) {
    return parts.filter(Boolean).join('\n\n---\n\n').trim();
}

function extractBetweenHeadings(md, startPattern, endPattern) {
    const lines = md.split('\n');
    let start = -1;
    let end = lines.length;

    for (let i = 0; i < lines.length; i += 1) {
        if (startPattern.test(lines[i])) {
            start = i;
            break;
        }
    }

    if (start === -1) return '';

    if (endPattern) {
        for (let j = start + 1; j < lines.length; j += 1) {
            if (endPattern.test(lines[j])) {
                end = j;
                break;
            }
        }
    }

    return lines.slice(start, end).join('\n').trim();
}

function parseDayBlocks(sectionMarkdown) {
    // Accept formats like:
    // - Monday
    // - Monday:
    // - **MONDAY**
    // - **MONDAY:**
    // - ### **MONDAY:**
    const headingDayPattern = /^\s*#{1,6}\s*(?:\*{1,2}\s*)?(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\s*:)?(?:\s*\*{1,2})?\s*$/i;
    const fallbackDayPattern = /^\s*(?:#{1,6}\s*)?(?:\*{1,2}\s*)?(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\s*:)?(?:\s*\*{1,2})?\s*$/i;
    const lines = sectionMarkdown.split('\n');

    function collectBlocks(pattern) {
        const blocks = [];
        let current = null;

        lines.forEach(line => {
            const match = line.match(pattern);
            if (match) {
                if (current) blocks.push(current);
                current = {
                    day: match[1],
                    content: [line]
                };
                return;
            }
            if (current) {
                current.content.push(line);
            }
        });

        if (current) blocks.push(current);

        return blocks.map(block => ({
            day: block.day,
            markdown: block.content.join('\n').trim()
        }));
    }

    const headingBlocks = collectBlocks(headingDayPattern);
    if (headingBlocks.length) return headingBlocks;
    return collectBlocks(fallbackDayPattern);
}

function extractTableRowForWeek(sectionMarkdown, weekNum) {
    const lines = sectionMarkdown.split('\n');
    for (const line of lines) {
        if (!line.includes('|')) continue;
        const cells = line.split('|').map(c => c.trim()).filter(Boolean);
        if (cells.length < 4) continue;
        const weekCell = cells[0].replace(/[^0-9]/g, '');
        if (weekCell && parseInt(weekCell, 10) === weekNum) {
            return cells;
        }
    }
    return null;
}

function extractWeekSpecificLine(contentLines, weekNum) {
    const weekPattern = new RegExp(`^[-*]?\\s*Week\\s*${weekNum}\\s*:\\s*(.+)$`, 'i');
    for (const line of contentLines) {
        const match = line.match(weekPattern);
        if (match) return match[1].trim();
    }
    return '';
}

function extractWeekSpecificTableValues(contentLines, weekNum) {
    const rowPattern = new RegExp(`^\\|\\s*${weekNum}\\s*\\|\\s*([^|]+?)\\s*\\|\\s*([^|]+?)\\s*\\|\\s*([^|]+?)\\s*\\|`, 'i');
    for (const line of contentLines) {
        const match = line.match(rowPattern);
        if (match) {
            return {
                distance: match[1].trim(),
                pace: match[2].trim(),
                target: match[3].trim()
            };
        }
    }
    return null;
}

function synthesizePhase1Days(sectionMarkdown, weekNum) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayText = {};

    if (weekNum >= 5 && weekNum <= 8) {
        const mon = sectionMarkdown.match(/\*\*Monday:\*\*\s*([^\n]+)/i);
        const wed = sectionMarkdown.match(/\*\*Wednesday:\*\*\s*([^\n]+)/i);
        const fri = sectionMarkdown.match(/\*\*Friday:\*\*\s*([^\n]+)/i);
        const row = extractTableRowForWeek(sectionMarkdown, weekNum);

        dayText.Monday = mon ? mon[1] : '5-6km easy run';
        dayText.Tuesday = 'Recovery walk or optional easy gym session.';
        dayText.Wednesday = wed ? wed[1] : '5-6km easy + strides';
        dayText.Thursday = 'Recovery walk or very easy jog based on fatigue.';
        dayText.Friday = fri ? fri[1] : '5-6km easy';
        dayText.Saturday = row
            ? `Long run: ${row[1]} @ ${row[2]} (target ${row[3]}).`
            : 'Long run progression day (see weekly table).';
        dayText.Sunday = 'Mandatory rest from running. Recovery walk only.';
    } else if (weekNum >= 9 && weekNum <= 11) {
        const mon = sectionMarkdown.match(/\*\*Monday:\*\*\s*([^\n]+)/i);
        const wed = sectionMarkdown.match(/\*\*Wednesday:\*\*\s*([^\n]+)/i);
        const fri = sectionMarkdown.match(/\*\*Friday:\*\*\s*([^\n]+)/i);
        const row = extractTableRowForWeek(sectionMarkdown, weekNum);

        dayText.Monday = mon ? mon[1] : '6-7km easy';
        dayText.Tuesday = 'Recovery walk or optional light strength maintenance.';
        dayText.Wednesday = wed ? wed[1] : '6km easy + strides';
        dayText.Thursday = 'Recovery walk or easy jog depending on freshness.';
        dayText.Friday = fri ? fri[1] : '6km progression run';
        dayText.Saturday = row
            ? `Long run: ${row[1]} @ ${row[2]} (${row[3]}).`
            : 'Long run progression day (see weekly table).';
        dayText.Sunday = 'Mandatory rest from running. Recovery walk optional.';
    } else if (weekNum === 12) {
        dayText.Monday = 'Recovery protocol: complete rest OR 20-30min easy walk.';
        dayText.Tuesday = 'Recovery protocol: complete rest OR 20-30min easy walk.';
        dayText.Wednesday = 'Recovery protocol: complete rest OR 20-30min easy walk.';
        dayText.Thursday = 'Test legs: 3km easy jog.';
        dayText.Friday = 'Light mobility session (30min), gentle stretching, foam rolling.';
        dayText.Saturday = '8km easy run at comfortable pace.';
        dayText.Sunday = 'Recovery walk or complete rest.';
    } else {
        return [];
    }

    return days.map(day => ({
        day,
        markdown: `### **${day.toUpperCase()}:**\n\n- ${dayText[day] || 'See weekly guidance.'}`
    }));
}

function extractStructuredDay(dayBlock, weekNum) {
    const rawLines = dayBlock.markdown.split('\n');
    const contentLinesRaw = rawLines.filter(line => !/^(#{1,6}\s*)?(\*\*|\*)?(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i.test(line));
    const contentLines = contentLinesRaw.map(line => line.trim()).filter(Boolean);
    const contentText = contentLines.join(' ');
    const fullMarkdown = contentLinesRaw.join('\n').trim();

    const weekSpecificLine = extractWeekSpecificLine(contentLines, weekNum);
    const weekTableValues = extractWeekSpecificTableValues(contentLines, weekNum);
    const weekSpecificText = [weekSpecificLine, weekTableValues ? `${weekTableValues.distance} ${weekTableValues.pace}` : ''].join(' ').trim();

    const distanceMatch = contentText.match(/\b(\d+(?:\.\d+)?\s?km|\d+x\d+m|\d+\s?min|REST|RACE DAY|WALK)\b/i);
    const weekDistanceMatch = weekSpecificText.match(/\b(\d+(?:\.\d+)?\s?km|\d+x\d+m|\d+\s?min|REST|RACE DAY|WALK)\b/i);
    const timeMatch = contentText.match(/\b([0-2]?\d:[0-5]\d\s?(?:am|pm)?)\b/i);
    const paceMatch = contentText.match(/\b\d{1,2}:\d{2}(?:\s?[\-–]\s?\d{1,2}:\d{2})?\s*\/km\b/i);
    const weekPaceMatch = weekSpecificText.match(/\b\d{1,2}:\d{2}(?:\s?[\-–]\s?\d{1,2}:\d{2})?\s*\/km\b/i);

    const hasMorning = /\bMorning\b/i.test(contentText);
    const hasEvening = /\bEvening\b/i.test(contentText);
    const hasGym = /\b(Strength Session|Gym|Virgin Active|Dumbbell|Pull-ups|Goblet Squats)\b/i.test(contentText);
    const hasMobility = /\bMobility Session\b/i.test(contentText);
    const hasStrength = /\b(Hamstring Strength Circuit|Nordic Curls|Strength Circuit)\b/i.test(contentText);
    let sessionSummary = '';
    if (hasMorning && hasEvening) {
        if (hasGym) sessionSummary = 'Morning + Evening Gym Session';
        else if (hasStrength) sessionSummary = 'Morning + Evening Strength Session';
        else if (hasMobility) sessionSummary = 'Morning + Evening Mobility Session';
        else sessionSummary = 'Morning + Evening Sessions';
    }

    const primaryBadge = weekDistanceMatch
        ? weekDistanceMatch[1].toUpperCase()
        : (distanceMatch ? distanceMatch[1].toUpperCase() : 'DAY PLAN');
    let secondaryBadge = '';
    if (hasMorning && hasEvening) {
        if (hasGym) secondaryBadge = 'GYM';
        else if (hasStrength) secondaryBadge = 'STRENGTH';
        else if (hasMobility) secondaryBadge = 'MOBILITY';
        else secondaryBadge = 'PM SESSION';
    }
    const badgeLabel = secondaryBadge ? `${primaryBadge} + ${secondaryBadge}` : primaryBadge;

    let workoutTitle = '';
    for (let i = 0; i < contentLines.length; i += 1) {
        const line = contentLines[i]
            .replace(/^#{1,6}\s*/, '')
            .replace(/^\*+|\*+$/g, '')
            .replace(/:$/, '')
            .trim();
        if (!line) continue;
        if (/^[-*]\s+/.test(contentLines[i])) continue;
        if (/^(Morning|Evening)\b/i.test(line)) continue;
        if (/^Week\s+\d+/i.test(line)) continue;
        workoutTitle = line;
        break;
    }
    if (!workoutTitle) workoutTitle = 'Daily Session';

    const bulletDetails = contentLines
        .filter(line => /^[-*]\s+/.test(line))
        .map(line => line.replace(/^[-*]\s+/, '').trim())
        .filter(Boolean);

    const details = bulletDetails.length
        ? bulletDetails
        : contentLines
            .map(line => line.replace(/^#{1,6}\s*/, '').replace(/^\*+|\*+$/g, '').trim())
            .filter(line => line && line.toLowerCase() !== workoutTitle.toLowerCase())
            .slice(0, 8);

    const previewDetails = details.slice(0, 3);

    return {
        day: dayBlock.day,
        distance: primaryBadge,
        badgeLabel,
        workout: workoutTitle,
        time: timeMatch ? timeMatch[1].toUpperCase() : '-',
        pace: weekPaceMatch ? weekPaceMatch[0] : (paceMatch ? paceMatch[0] : '-'),
        details,
        previewDetails,
        fullMarkdown,
        sessionSummary
    };
}

function renderWeekCards(dayBlocks, options) {
    const todayName = options.todayName || '';
    const detailed = !!options.detailed;
    const weekNum = options.weekNum || 1;
    const fullWeek = options.fullWeek !== false;
    const phaseFile = options.phaseFile || getSelectedPhaseFile();
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const structured = dayBlocks.map(day => extractStructuredDay(day, weekNum));
    const byDay = new Map(structured.map(day => [day.day.toLowerCase(), day]));

    // Always render a full week so users can see every day even when markdown is sparse.
    const renderedCards = (fullWeek ? weekDays : structured.map(day => day.day)).map(dayName => {
        const existing = byDay.get(dayName.toLowerCase());
        if (existing) return existing;
        return {
            day: dayName,
            distance: 'TBD',
            workout: 'No Specific Session Listed',
            time: '-',
            pace: '-',
            details: [
                'No explicit workout was found for this day in the markdown week block.',
                'Use this as a flexible/recovery slot unless your coach notes say otherwise.'
            ]
        };
    });

    if (detailed) {
        return renderedCards.map(dayData => {
            const isToday = todayName && dayData.day.toLowerCase() === todayName.toLowerCase();
            return `
                <div class="workout-detail-card" ${isToday ? 'style="border-color: var(--red);"' : ''}>
                    <div class="workout-detail-header" ${isToday ? 'style="background: var(--red);"' : ''}>
                        <div class="workout-detail-day">${dayData.day.toUpperCase()}</div>
                        <div class="workout-detail-badge" ${isToday ? 'style="background: var(--black);"' : ''}>${dayData.badgeLabel || dayData.distance}</div>
                    </div>
                    <div class="workout-detail-body">
                        <h3 style="margin-top: 0;">${dayData.workout}</h3>
                        ${dayData.time !== '-' || dayData.pace !== '-' ? `<p class="text-mono"><strong>Time:</strong> ${dayData.time} | <strong>Pace:</strong> ${dayData.pace}</p>` : ''}
                        ${dayData.sessionSummary ? `<p class="text-mono"><strong>Sessions:</strong> ${dayData.sessionSummary}</p>` : ''}
                        <div class="workout-section">
                            <div class="workout-section-title">Workout Details</div>
                            <div>${marked.parse(dayData.fullMarkdown || dayData.markdown || '')}</div>
                        </div>
                        <label class="complete-toggle"><input class="day-complete-toggle" type="checkbox" data-day="${dayData.day}" ${isDayCompleted(phaseFile, weekNum, dayData.day) ? 'checked' : ''}>Mark ${dayData.day} complete</label>
                    </div>
                </div>
            `;
        }).join('');
    }

    return `
        <div class="week-schedule">
            ${renderedCards.map(dayData => {
                const isToday = todayName && dayData.day.toLowerCase() === todayName.toLowerCase();
                return `
                    <div class="day-card" ${isToday ? 'style="border-color: var(--red); background: var(--gray-100);"' : ''}>
                        <div class="day-header">
                            <span>${dayData.day.toUpperCase()}</span>
                            <span>${dayData.distance}</span>
                        </div>
                        <div class="day-title">${dayData.workout}</div>
                        <div class="day-detail">${dayData.previewDetails.join(' • ') || 'See detailed day view for full breakdown.'}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function extractWeekSection(md, phaseFile, weekNum) {
    if (phaseFile === '03_Phase1_Foundation.md') {
        if (weekNum >= 1 && weekNum <= 4) {
            return extractBetweenHeadings(
                md,
                /WEEKS 1-4: ADAPTATION PHASE/i,
                /WEEKS 5-8: VOLUME BUILDING PHASE/i
            );
        }
        if (weekNum >= 5 && weekNum <= 8) {
            return extractBetweenHeadings(
                md,
                /WEEKS 5-8: VOLUME BUILDING PHASE/i,
                /WEEKS 9-11: CONSOLIDATION PHASE/i
            );
        }
        if (weekNum >= 9 && weekNum <= 11) {
            return extractBetweenHeadings(
                md,
                /WEEKS 9-11: CONSOLIDATION PHASE/i,
                /WEEK 12: RECOVERY WEEK/i
            );
        }
        if (weekNum === 12) {
            return extractBetweenHeadings(
                md,
                /WEEK 12: RECOVERY WEEK/i,
                /PHASE 1 SUMMARY/i
            );
        }
        return '';
    }

    if (phaseFile === '04_Phase2_Speed.md') {
        if (weekNum === 13) return findHeadingSection(md, /Week 13: RECOVERY WEEK/i);
        if (weekNum >= 16 && weekNum <= 18) return findHeadingSection(md, /CRITICAL: EXAM PERIOD/i);
        if (weekNum >= 14 && weekNum <= 15) {
            return combineSections([
                findHeadingSection(md, /NEW WEEKLY STRUCTURE \(WEEKS 14-15, 19-20\)/i),
                findHeadingSection(md, /MONDAY: SPEED SESSION/i),
                findHeadingSection(md, /TUESDAY: EASY RUN/i),
                findHeadingSection(md, /WEDNESDAY: TEMPO RUN/i),
                findHeadingSection(md, /THURSDAY: EASY RUN OR REST/i),
                findHeadingSection(md, /FRIDAY: EASY RUN/i),
                findHeadingSection(md, /SATURDAY: LONG RUN/i),
                findHeadingSection(md, /SUNDAY: RECOVERY/i)
            ]);
        }
        if (weekNum >= 19 && weekNum <= 20) {
            return combineSections([
                findHeadingSection(md, /NEW WEEKLY STRUCTURE \(WEEKS 14-15, 19-20\)/i),
                findHeadingSection(md, /MONDAY: SPEED SESSION/i),
                findHeadingSection(md, /TUESDAY: EASY RUN/i),
                findHeadingSection(md, /WEDNESDAY: TEMPO RUN/i),
                findHeadingSection(md, /THURSDAY: EASY RUN OR REST/i),
                findHeadingSection(md, /FRIDAY: EASY RUN/i),
                findHeadingSection(md, /SATURDAY: LONG RUN/i),
                findHeadingSection(md, /SUNDAY: RECOVERY/i),
                findHeadingSection(md, /WEEK 20 ASSESSMENT/i)
            ]);
        }
        return '';
    }

    if (phaseFile === '05_Phase3_Build.md') {
        if (weekNum === 32 || weekNum === 35 || weekNum === 36) {
            return combineSections([
                findHeadingSection(md, /RACE WEEK PROTOCOLS/i),
                findHeadingSection(md, /WEEKLY VOLUME \(PHASE 3 OVERVIEW\)/i)
            ]);
        }
        return combineSections([
            findHeadingSection(md, /WEEKLY STRUCTURE \(WEEKS 21-36\)/i),
            findHeadingSection(md, /MONDAY: SPEED INTERVALS/i),
            findHeadingSection(md, /TUESDAY: EASY RUN/i),
            findHeadingSection(md, /WEDNESDAY: TEMPO\/THRESHOLD RUN/i),
            findHeadingSection(md, /THURSDAY: EASY RUN OR REST/i),
            findHeadingSection(md, /FRIDAY: EASY RUN/i),
            findHeadingSection(md, /SATURDAY: LONG RUN/i),
            findHeadingSection(md, /SUNDAY: RECOVERY/i),
            findHeadingSection(md, /WEEKLY VOLUME \(PHASE 3 OVERVIEW\)/i)
        ]);
    }

    if (phaseFile === '06_Phase4_Peak.md') {
        if (weekNum === 38) return findHeadingSection(md, /WEEK 38: FORD 3-IN-1 HALF MARATHON/i);
        if (weekNum === 39) return findHeadingSection(md, /WEEK 39: POST-FORD RECOVERY WEEK/i);
        return combineSections([
            findHeadingSection(md, /WEEKLY STRUCTURE \(WEEKS 37, 39-41\)/i),
            findHeadingSection(md, /MONDAY: FAST INTERVALS/i),
            findHeadingSection(md, /TUESDAY: EASY RUN/i),
            findHeadingSection(md, /WEDNESDAY: RACE PACE TEMPO/i),
            findHeadingSection(md, /THURSDAY: EASY RUN OR REST/i),
            findHeadingSection(md, /FRIDAY: EASY RUN/i),
            findHeadingSection(md, /SATURDAY: LONG RUN/i),
            findHeadingSection(md, /SUNDAY: RECOVERY/i)
        ]);
    }

    if (phaseFile === '07_Phase5_Taper_and_RaceDay.md') {
        if (weekNum === 42) return findHeadingSection(md, /WEEK 42: FIRST TAPER WEEK/i);
        if (weekNum === 43) return findHeadingSection(md, /WEEK 43: SECOND TAPER WEEK/i);
        if (weekNum === 44) return combineSections([
            findHeadingSection(md, /WEEK 44: RACE WEEK/i),
            findHeadingSection(md, /SOWETO MARATHON - 21\.1KM/i)
        ]);
        return '';
    }

    return '';
}

function weekTitleForPhase(phaseFile, weekNum) {
    const label = phaseFile.replace('.md', '').replace(/^[0-9]+_/, '').replace(/_/g, ' ');
    return `Week ${weekNum} • ${label}`;
}

function setActiveWeekButton(sectionSelector, weekNum) {
    const buttons = document.querySelectorAll(sectionSelector + ' .week-btn');
    buttons.forEach(btn => {
        const isActive = btn.textContent.trim().toLowerCase() === `week ${weekNum}`.toLowerCase();
        btn.classList.toggle('active', isActive);
    });
}

async function loadMarkdownWeekInto(containerId, phaseFile, weekNum, includeTodayHeader) {
    const container = document.getElementById(containerId);
    if (!container) return;

    currentPhaseFile = phaseFile;
    currentWeekNum = weekNum;
    updateStickyBar();

    try {
        const markdown = await fetchMarkdownCached(phaseFile);
        const weekSection = getWeekSectionCached(markdown, phaseFile, weekNum);

        if (!weekSection) {
            container.innerHTML = '<div class="info-box">No matching plan section found for this week.</div>';
            return;
        }

        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        let dayBlocks = parseDayBlocks(weekSection);
        if (!dayBlocks.length && phaseFile === '03_Phase1_Foundation.md') {
            dayBlocks = synthesizePhase1Days(weekSection, weekNum);
        }
        dayBlocks = applyTrainingStateAdjustments(dayBlocks, getTrainingState());
        const title = weekTitleForPhase(phaseFile, weekNum);
        let header = '';
        const dayContext = `<div class="daily-reset-banner">Today is ${todayName.toUpperCase()} - follow the ${todayName.toUpperCase()} block below.</div>`;
        if (includeTodayHeader) {
            header = `<div class="info-box"><div class="info-box-title">Today: ${todayName}</div><p style="margin:0;">Showing this week's official plan in the interactive week layout.</p></div>`;
        }

        let bodyHtml = '';
        if (getTodayModeEnabled() && includeTodayHeader) {
            bodyHtml = renderTodayOnly(dayBlocks, weekNum, todayName);
        } else {
            bodyHtml = renderWeekCards(dayBlocks, {
                detailed: true,
                todayName: todayName,
                weekNum: weekNum,
                fullWeek: true,
                phaseFile: phaseFile
            });
        }

        container.innerHTML = `${header}${dayContext}<h2>${title}</h2>${bodyHtml}`;
        bindCompletionHandlers(container, phaseFile, weekNum);
        renderWeeklySummaryStrip(dayBlocks, weekNum);
        updateCompletionUI(phaseFile, weekNum);
    } catch (error) {
        container.innerHTML = '<div class="info-box">Could not load workout plan.</div>';
    }
}

function updateTodayWeekOptions() {
    const phaseFile = getSelectedPhaseFile();
    const weekSelect = document.getElementById('weekSelect');
    const config = PHASE_CONFIG[phaseFile] || { minWeek: 1, maxWeek: 12 };
    const previous = parseInt(weekSelect.value, 10);

    weekSelect.innerHTML = '';
    for (let w = config.minWeek; w <= config.maxWeek; w += 1) {
        const option = document.createElement('option');
        option.value = String(w);
        option.textContent = `Week ${w}`;
        weekSelect.appendChild(option);
    }

    const fallback = config.minWeek;
    const nextValue = Number.isInteger(previous) && previous >= config.minWeek && previous <= config.maxWeek
        ? previous
        : fallback;
    weekSelect.value = String(nextValue);
}

async function loadTodaysWorkout() {
    const phaseFile = getSelectedPhaseFile();
    const weekNum = getSelectedWeek();
    const dateEl = document.getElementById('todayDate');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    await loadMarkdownWeekInto('todaysWorkoutContent', phaseFile, weekNum, true);
}

function showTodaysWorkout() {
    showSection('todays-workout');
    loadTodaysWorkout();
}

function showWeekDetails(weekNum) {
    currentPhaseFile = '03_Phase1_Foundation.md';
    currentWeekNum = weekNum;
    setActiveWeekButton('#phase1', weekNum);
    const bridge = document.getElementById('phase1CatchupBridge');
    if (bridge) {
        bridge.style.display = (weekNum >= 4 && weekNum <= 7) ? 'block' : 'none';
    }
    loadMarkdownWeekInto('weekDetailsContainer', '03_Phase1_Foundation.md', weekNum, false);
}

function showPhase2Week(weekNum) {
    currentPhaseFile = '04_Phase2_Speed.md';
    currentWeekNum = weekNum;
    setActiveWeekButton('#phase2', weekNum);
    loadMarkdownWeekInto('phase2WeekDetails', '04_Phase2_Speed.md', weekNum, false);
}

function showPhase3Week(weekNum) {
    currentPhaseFile = '05_Phase3_Build.md';
    currentWeekNum = weekNum;
    setActiveWeekButton('#phase3', weekNum);
    loadMarkdownWeekInto('phase3WeekDetails', '05_Phase3_Build.md', weekNum, false);
}

function showPhase4Week(weekNum) {
    currentPhaseFile = '06_Phase4_Peak.md';
    currentWeekNum = weekNum;
    setActiveWeekButton('#phase4', weekNum);
    loadMarkdownWeekInto('phase4WeekDetails', '06_Phase4_Peak.md', weekNum, false);
}

function showPhase5Week(weekNum) {
    currentPhaseFile = '07_Phase5_Taper_and_RaceDay.md';
    currentWeekNum = weekNum;
    setActiveWeekButton('#phase5', weekNum);
    loadMarkdownWeekInto('phase5WeekDetails', '07_Phase5_Taper_and_RaceDay.md', weekNum, false);
}

document.addEventListener('DOMContentLoaded', function() {
    const loadBtn = document.getElementById('loadWorkoutBtn');
    const phaseSelect = document.getElementById('phaseSelect');
    const weekSelect = document.getElementById('weekSelect');
    const todayModeToggle = document.getElementById('todayModeToggle');
    const trainingState = document.getElementById('trainingState');
    const checkFatigueBtn = document.getElementById('checkFatigueBtn');

    if (phaseSelect) {
        phaseSelect.addEventListener('change', function() {
            updateTodayWeekOptions();
            loadTodaysWorkout();
        });
        weekSelect.addEventListener('change', loadTodaysWorkout);
    }
    if (loadBtn) {
        loadBtn.addEventListener('click', loadTodaysWorkout);
    }
    if (todayModeToggle) {
        todayModeToggle.addEventListener('change', loadTodaysWorkout);
    }
    if (trainingState) {
        trainingState.addEventListener('change', loadTodaysWorkout);
    }
    if (checkFatigueBtn) {
        checkFatigueBtn.addEventListener('click', evaluateFatigueRisk);
    }

    updateTodayWeekOptions();

    // Initial sync of per-phase week sections.
    showWeekDetails(1);
    showPhase2Week(13);
    showPhase3Week(21);
    showPhase4Week(37);
    showPhase5Week(42);

    attachSwipeNavigation('weekDetailsContainer', 1, 12, showWeekDetails, function() { return getActiveWeekFromSection('#phase1', 1); });
    attachSwipeNavigation('phase2WeekDetails', 13, 20, showPhase2Week, function() { return getActiveWeekFromSection('#phase2', 13); });
    attachSwipeNavigation('phase3WeekDetails', 21, 36, showPhase3Week, function() { return getActiveWeekFromSection('#phase3', 21); });
    attachSwipeNavigation('phase4WeekDetails', 37, 41, showPhase4Week, function() { return getActiveWeekFromSection('#phase4', 37); });
    attachSwipeNavigation('phase5WeekDetails', 42, 44, showPhase5Week, function() { return getActiveWeekFromSection('#phase5', 42); });
});

