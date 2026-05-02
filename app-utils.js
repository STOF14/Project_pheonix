window.ProjectPhoenixUtils = {
    getStoredJson(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
        } catch (error) {
            return fallback;
        }
    },

    setStoredJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    getIsoDateKey(date) {
        return date.toISOString().split('T')[0];
    },

    getTrainingWeekIndex(startDate, date) {
        const start = new Date(startDate);
        const current = date ? new Date(date) : new Date();
        const daysSinceStart = Math.floor((current - start) / (1000 * 60 * 60 * 24));
        return Math.max(1, Math.floor(daysSinceStart / 7) + 1);
    },

    getTrainingWeekKey(startDate, date) {
        const current = date ? new Date(date) : new Date();
        const weekIndex = window.ProjectPhoenixUtils.getTrainingWeekIndex(startDate, current);
        return `week-${current.getFullYear()}-W${weekIndex}`;
    }
};
