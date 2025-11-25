// ===== Mock Data for Demo =====
const courses = [
    {
        id: 1,
        title: 'React Fundamentals',
        description: 'Learn the basics of React development and build dynamic web applications.',
        instructor: 'Jane Smith',
        duration: '8 weeks',
        students: 156,
        rating: 4.8,
        progress: 65,
        thumbnail: '⚛️',
        category: 'Programming',
        lessons: [
            { id: 1, title: 'Introduction to React', type: 'video', duration: '15 min', completed: true },
            { id: 2, title: 'JSX and Components', type: 'video', duration: '20 min', completed: true },
            { id: 3, title: 'State and Props', type: 'video', duration: '25 min', completed: false },
            { id: 4, title: 'Event Handling', type: 'quiz', duration: '10 min', completed: false },
            { id: 5, title: 'Final Project', type: 'assignment', duration: '2 hours', completed: false }
        ]
    },
    {
        id: 2,
        title: 'Python for Data Science',
        description: 'Master Python programming for data analysis and machine learning.',
        instructor: 'Mike Johnson',
        duration: '12 weeks',
        students: 203,
        rating: 4.9,
        progress: 30,
        thumbnail: '🐍',
        category: 'Data Science',
        lessons: [
            { id: 1, title: 'Python Basics', type: 'video', duration: '30 min', completed: true },
            { id: 2, title: 'Data Structures', type: 'video', duration: '45 min', completed: false },
            { id: 3, title: 'Pandas Introduction', type: 'video', duration: '40 min', completed: false }
        ]
    }
];

const assignments = [
    { id: 1, title: 'React Component Assignment', course: 'React Fundamentals', dueDate: '2025-09-05', status: 'pending' },
    { id: 2, title: 'Data Analysis Project', course: 'Python for Data Science', dueDate: '2025-09-10', status: 'submitted' },
    { id: 3, title: 'Design Portfolio', course: 'UI/UX Design Principles', dueDate: '2025-09-15', status: 'graded' }
];

let currentUser = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    console.log("LMS Loaded");

    setupEventListeners();
    checkLoginStatus();
});

// ===== Event Listeners =====
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const addCourseBtn = document.getElementById('addCourseBtn');
    const backToCoursesBtn = document.getElementById('backToCoursesBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    if (addCourseBtn) {
        addCourseBtn.addEventListener('click', showAddCourseForm);
    }

    if (backToCoursesBtn) {
        backToCoursesBtn.addEventListener('click', backToCourses);
    }

    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    switchTab('dashboard');
                    break;
                case '2':
                    e.preventDefault();
                    switchTab('courses');
                    break;
                case '3':
                    e.preventDefault();
                    switchTab('assignments');
                    break;
            }
        }
    });
}

// ===== FORM VALIDATION + LOGIN HANDLER =====
function handleLogin(e) {
    e.preventDefault();

    const role = document.getElementById('userRole').value;
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    let errors = [];

    if (!role) errors.push("Please select your role.");
    if (!email) errors.push("Email cannot be empty.");
    if (email && !validateEmail(email)) errors.push("Enter a valid email address.");
    if (!password) errors.push("Password cannot be empty.");
    if (password && password.length < 6) errors.push("Password must be at least 6 characters.");

    if (errors.length > 0) {
        alert("⚠️ ERROR:\n\n" + errors.join("\n"));
        return;
    }

    // If validation passes, try to authenticate
    authenticateUser(role, email, password);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ===== AUTHENTICATION =====
function authenticateUser(role, email, password) {
    fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, email, password })
    })
    .then(async res => {
        const data = await res.json();

        if (!res.ok) {
            alert("❌ Login failed: " + data.message);
            return;
        }

        localStorage.setItem("lmsUser", JSON.stringify(data.user));
        loginSuccess(data.user);
    })
    .catch(err => {
        console.error(err);
        alert("Network error");
    });
}

// LOGIN SUCCESS
function loginSuccess(user) {
    currentUser = {
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.role === "student" ? "👨‍🎓" :
                user.role === "instructor" ? "👩‍🏫" : "👤"
    };

    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('lmsSection').classList.remove('hidden');

    document.getElementById('userName').textContent = `Welcome, ${currentUser.name}!`;
    document.getElementById('userAvatar').textContent = currentUser.avatar;

    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileRole').textContent =
        currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);

    loadCourses();
    loadAssignments();
}

// Check if already logged in
function checkLoginStatus() {
    const savedUser = localStorage.getItem("lmsUser");
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            loginSuccess(user);
        } catch (e) {
            console.error("Error parsing saved user", e);
        }
    }
}

// ===== LOGOUT =====
function logout() {
    localStorage.removeItem("lmsUser");
    currentUser = null;
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('lmsSection').classList.add('hidden');
    document.getElementById('loginForm').reset();
}

// ===== NAVIGATION TABS =====
function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    const selectedTab = document.getElementById(tabName);
    if (selectedTab) selectedTab.classList.remove('hidden');
}

// ===== COURSES =====
function loadCourses() {
    const coursesGrid = document.getElementById('coursesGrid');
    coursesGrid.innerHTML = '';

    courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        courseCard.innerHTML = `
            <div class="course-header">
                <div class="course-thumbnail">${course.thumbnail}</div>
                <div class="course-title">${course.title}</div>
                <div class="course-instructor">by ${course.instructor}</div>
            </div>
            <div class="course-body">
                <div class="course-description">${course.description}</div>
                <div class="course-meta">
                    <div class="meta-item">⏱️ ${course.duration}</div>
                    <div class="meta-item">👥 ${course.students} students</div>
                    <div class="meta-item">⭐ ${course.rating}</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${course.progress}%"></div>
                </div>
                <div style="margin-bottom: 1rem; font-size: 0.9rem; color: #666;">
                    Progress: ${course.progress}%
                </div>
                <div class="course-actions">
                    <button class="btn btn-primary" onclick="viewCourse(${course.id})">
                        ▶️ Continue Learning
                    </button>
                    <button class="btn btn-secondary" onclick="showCourseInfo(${course.id})">
                        ℹ️ Info
                    </button>
                </div>
            </div>
        `;
        coursesGrid.appendChild(courseCard);
    });
}

function viewCourse(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    document.getElementById('courses').classList.add('hidden');
    document.getElementById('courseDetail').classList.remove('hidden');

    const courseDetailContent = document.getElementById('courseDetailContent');
    courseDetailContent.innerHTML = `
        <div class="course-detail-header">
            <div style="font-size: 4rem; margin-bottom: 1rem;">${course.thumbnail}</div>
            <div class="course-detail-title">${course.title}</div>
            <div style="font-size: 1.2rem; opacity: 0.9;">Instructor: ${course.instructor}</div>
            <div style="margin-top: 1rem; display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap;">
                <div>⏱️ ${course.duration}</div>
                <div>👥 ${course.students} students</div>
                <div>⭐ ${course.rating} rating</div>
            </div>
        </div>

        <div style="margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1rem;">📚 Course Lessons</h3>
            <div class="lessons-list">
                ${course.lessons.map((lesson) => `
                    <div class="lesson-item" onclick="playLesson(${course.id}, ${lesson.id})">
                        <div class="lesson-info">
                            <div class="lesson-icon ${lesson.type}">
                                ${lesson.type === 'video' ? '▶️' : lesson.type === 'quiz' ? '❓' : '📝'}
                            </div>
                            <div class="lesson-details">
                                <h4>${lesson.title}</h4>
                                <div class="lesson-meta">
                                    <span>${lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)}</span>
                                    <span>⏱️ ${lesson.duration}</span>
                                </div>
                            </div>
                        </div>
                        <div class="completion-status ${lesson.completed ? 'completed' : 'pending'}">
                            ${lesson.completed ? '✅ Completed' : '⏳ Pending'}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="dashboard-card">
            <h3 style="margin-bottom: 1rem;">📊 Your Progress</h3>
            <div class="progress-bar" style="margin-bottom: 1rem;">
                <div class="progress-fill" style="width: ${course.progress}%"></div>
            </div>
            <p style="color: #666;">You've completed ${course.progress}% of this course</p>
        </div>
    `;
}

function backToCourses() {
    document.getElementById('courseDetail').classList.add('hidden');
    document.getElementById('courses').classList.remove('hidden');
    loadCourses();
}

function playLesson(courseId, lessonId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    const lesson = course.lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    if (lesson.type === 'video') {
        alert(`🎬 Playing video: "${lesson.title}"`);
    } else if (lesson.type === 'quiz') {
        alert(`❓ Starting quiz: "${lesson.title}"`);
    } else if (lesson.type === 'assignment') {
        alert(`📝 Opening assignment: "${lesson.title}"`);
    }

    if (!lesson.completed) {
        lesson.completed = true;

        const completedLessons = course.lessons.filter(l => l.completed).length;
        course.progress = Math.round((completedLessons / course.lessons.length) * 100);

        viewCourse(courseId);

        setTimeout(() => {
            alert(`🎉 Congratulations! You've completed "${lesson.title}"!\nYour progress: ${course.progress}%`);
        }, 500);
    }
}

function showCourseInfo(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    alert(
        `📚 Course Information\n\n` +
        `Title: ${course.title}\n` +
        `Instructor: ${course.instructor}\n` +
        `Duration: ${course.duration}\n` +
        `Students: ${course.students}\n` +
        `Rating: ${course.rating}/5\n` +
        `Category: ${course.category}\n\n` +
        `${course.description}`
    );
}

function showAddCourseForm() {
    const title = prompt('Enter course title:');
    if (!title) return;
    
    const instructor = prompt('Enter instructor name:');
    if (!instructor) return;
    
    const description = prompt('Enter course description:');
    if (!description) return;

    const newCourse = {
        id: courses.length + 1,
        title,
        description,
        instructor,
        duration: '6 weeks',
        students: 0,
        rating: 5.0,
        progress: 0,
        thumbnail: '📖',
        category: 'General',
        lessons: [
            { id: 1, title: 'Introduction', type: 'video', duration: '15 min', completed: false }
        ]
    };

    courses.push(newCourse);
    loadCourses();
    alert('✅ Course added successfully!');
}

// ===== ASSIGNMENTS =====
function loadAssignments() {
    const assignmentsList = document.getElementById('assignmentsList');
    assignmentsList.innerHTML = '';

    assignments.forEach(assignment => {
        const assignmentCard = document.createElement('div');
        assignmentCard.className = 'assignment-card';
        
        const statusClass = `status-${assignment.status}`;
        const statusText = assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1);
        
        assignmentCard.innerHTML = `
            <div class="assignment-header">
                <div>
                    <div class="assignment-title">${assignment.title}</div>
                    <div class="assignment-course">${assignment.course}</div>
                </div>
                <div class="status-badge ${statusClass}">${statusText}</div>
            </div>
            <div class="due-date">
                📅 Due: ${new Date(assignment.dueDate).toLocaleDateString()}
            </div>
        `;
        assignmentsList.appendChild(assignmentCard);
    });
}
