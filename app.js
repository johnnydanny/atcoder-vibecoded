// State management
let state = {
    currentCategory: 'all',
    searchQuery: '',
    difficultyFilter: 'all',
    statusFilter: 'all',
    solvedProblems: new Set()
};

// Load solved problems from localStorage
function loadProgress() {
    const saved = localStorage.getItem('atcoder_solved');
    if (saved) {
        state.solvedProblems = new Set(JSON.parse(saved));
    }
}

// Save progress to localStorage
function saveProgress() {
    localStorage.setItem('atcoder_solved', JSON.stringify([...state.solvedProblems]));
    updateStats();
}

// Reset all progress
function resetProgress() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
        state.solvedProblems.clear();
        localStorage.removeItem('atcoder_solved');
        updateStats();
        renderProblems();
    }
}

// Toggle problem solved status
function toggleSolved(url) {
    if (state.solvedProblems.has(url)) {
        state.solvedProblems.delete(url);
    } else {
        state.solvedProblems.add(url);
    }
    saveProgress();
    renderProblems();
}

// Get all problems as flat array
function getAllProblems() {
    const problems = [];
    for (const [category, categoryProblems] of Object.entries(problemsData)) {
        categoryProblems.forEach(problem => {
            problems.push({
                ...problem,
                category: category
            });
        });
    }
    return problems;
}

// Filter problems based on current state
function getFilteredProblems() {
    let problems = getAllProblems();

    // Filter by category
    if (state.currentCategory !== 'all') {
        problems = problems.filter(p => p.category === state.currentCategory);
    }

    // Filter by search query
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        problems = problems.filter(p => 
            p.task.toLowerCase().includes(query) ||
            p.contest.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query)
        );
    }

    // Filter by difficulty
    if (state.difficultyFilter !== 'all') {
        problems = problems.filter(p => p.difficulty === state.difficultyFilter);
    }

    // Filter by status
    if (state.statusFilter === 'solved') {
        problems = problems.filter(p => state.solvedProblems.has(p.url));
    } else if (state.statusFilter === 'unsolved') {
        problems = problems.filter(p => !state.solvedProblems.has(p.url));
    }

    return problems;
}

// Sort problems by difficulty and contest number
function sortProblems(problems) {
    const difficultyOrder = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'Unknown': 9 };
    
    return problems.sort((a, b) => {
        // First sort by difficulty
        const diffA = difficultyOrder[a.difficulty] || 9;
        const diffB = difficultyOrder[b.difficulty] || 9;
        if (diffA !== diffB) return diffA - diffB;
        
        // Then by contest number (extract number from contest name)
        const numA = parseInt(a.contest.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.contest.match(/\d+/)?.[0] || '0');
        return numA - numB;
    });
}

// Render category tabs
function renderCategoryTabs() {
    const tabsContainer = document.getElementById('categoryTabs');
    const categories = Object.keys(problemsData);
    
    let html = `
        <div class="category-tab ${state.currentCategory === 'all' ? 'active' : ''}" onclick="selectCategory('all')">
            All Categories
            <span class="count">${getAllProblems().length}</span>
        </div>
    `;
    
    categories.forEach(category => {
        const count = problemsData[category].length;
        html += `
            <div class="category-tab ${state.currentCategory === category ? 'active' : ''}" onclick="selectCategory('${category}')">
                ${category}
                <span class="count">${count}</span>
            </div>
        `;
    });
    
    tabsContainer.innerHTML = html;
}

// Select category
function selectCategory(category) {
    state.currentCategory = category;
    renderCategoryTabs();
    renderProblems();
}

// Render problems grid
function renderProblems() {
    const grid = document.getElementById('problemsGrid');
    const problems = sortProblems(getFilteredProblems());
    
    if (problems.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No problems found</h3>
                <p>Try adjusting your filters or search query</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    problems.forEach(problem => {
        const isSolved = state.solvedProblems.has(problem.url);
        html += `
            <div class="problem-card ${isSolved ? 'solved' : ''}">
                <div class="checkbox-wrapper">
                    <input type="checkbox" 
                           class="checkbox" 
                           ${isSolved ? 'checked' : ''} 
                           onchange="toggleSolved('${problem.url}')"
                           title="${isSolved ? 'Mark as unsolved' : 'Mark as solved'}">
                </div>
                <div class="problem-info">
                    <div class="problem-title">${problem.task.replace(/_/g, ' ').toUpperCase()}</div>
                    <div class="problem-meta">
                        <span>Contest: ${problem.contest.toUpperCase()}</span>
                    </div>
                </div>
                <div class="difficulty-badge diff-${problem.difficulty}">
                    ${problem.difficulty}
                </div>
                <div class="category-badge">${problem.category}</div>
                <a href="${problem.url}" 
                   target="_blank" 
                   class="action-btn"
                   title="Open problem on AtCoder">
                    Solve →
                </a>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

// Update statistics
function updateStats() {
    const totalProblems = getAllProblems().length;
    const solvedCount = state.solvedProblems.size;
    const progressPercent = totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;
    
    document.getElementById('totalProblems').textContent = totalProblems;
    document.getElementById('solvedCount').textContent = solvedCount;
    document.getElementById('progressPercent').textContent = `${progressPercent}%`;
    document.getElementById('categoriesCount').textContent = Object.keys(problemsData).length;
}

// Initialize event listeners
function initEventListeners() {
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderProblems();
    });
    
    // Difficulty filter
    document.getElementById('difficultyFilter').addEventListener('change', (e) => {
        state.difficultyFilter = e.target.value;
        renderProblems();
    });
    
    // Status filter
    document.getElementById('statusFilter').addEventListener('change', (e) => {
        state.statusFilter = e.target.value;
        renderProblems();
    });
}

// Initialize app
function init() {
    loadProgress();
    initEventListeners();
    renderCategoryTabs();
    renderProblems();
    updateStats();
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
