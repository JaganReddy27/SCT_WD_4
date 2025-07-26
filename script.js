document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const taskTitleInput = document.getElementById('task-title');
    const taskDescriptionInput = document.getElementById('task-description');
    const taskDueDateInput = document.getElementById('task-due-date');
    const taskPrioritySelect = document.getElementById('task-priority');
    const taskCategorySelect = document.getElementById('task-category');
    const addTaskBtn = document.getElementById('add-task-btn');
    const addTaskMessage = document.getElementById('add-task-message'); // Confirmation message
    const taskListsContainer = document.querySelector('.task-lists-container');

    const searchInput = document.getElementById('search-input');
    const filterStatusSelect = document.getElementById('filter-status');
    const filterDateInput = document.getElementById('filter-date');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');

    const progressFill = document.querySelector('.progress-bar-fill');
    const progressText = document.getElementById('progress-text');

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const quoteToast = document.getElementById('quote-toast');

    const modal = document.getElementById('modal');
    const closeModalBtn = document.querySelector('.close-button');
    const modalTitle = document.getElementById('modal-title');
    const editTaskTitleInput = document.getElementById('edit-task-title');
    const editTaskDescriptionInput = document.getElementById('edit-task-description');
    const editTaskDueDateInput = document.getElementById('edit-task-due-date');
    const editTaskPrioritySelect = document.getElementById('edit-task-priority');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const editTaskMessage = document.getElementById('edit-task-message'); // Confirmation message

    let tasks = []; // Array to store all tasks
    // Pre-defined categories
    let categories = ['General', 'Work', 'Personal', 'Shopping', 'Health'];

    // --- Local Storage Management ---
    const saveTasks = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('categories', JSON.stringify(categories)); // Save categories too
    };

    const loadTasks = () => {
        const storedTasks = localStorage.getItem('tasks');
        const storedCategories = localStorage.getItem('categories');

        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
            // Ensure dueDate is converted back to Date objects for proper comparison
            tasks.forEach(task => {
                if (task.dueDate) {
                    task.dueDate = new Date(task.dueDate);
                }
            });
        } else {
            // Pre-populate with some example tasks if nothing in local storage
            tasks = [
                { id: 1, title: 'Complete To-Do App Refinement', description: 'Ensure all features are working and styling is polished.', dueDate: new Date(new Date().setHours(23, 59, 0, 0)), priority: 'high', category: 'Work', completed: false },
                { id: 2, title: 'Buy Groceries', description: 'Milk, Eggs, Bread, Fruits, Vegetables.', dueDate: null, priority: 'medium', category: 'Shopping', completed: false },
                { id: 3, title: 'Go for a run', description: 'Morning 30-minute jog in the park.', dueDate: new Date(new Date().setDate(new Date().getDate() + 1)), priority: 'low', category: 'Health', completed: false },
                { id: 4, title: 'Read "The Great Gatsby"', description: 'Finish Chapter 3.', dueDate: new Date(new Date().setDate(new Date().getDate() + 2)), priority: 'low', category: 'Personal', completed: false },
                { id: 5, title: 'Send Project Report', description: 'Final review and submission to client.', dueDate: new Date(new Date().setHours(17, 0, 0, 0)), priority: 'high', category: 'Work', completed: true },
                { id: 6, title: 'Call Mom', description: 'Catch up on family news.', dueDate: new Date(new Date().setDate(new Date().getDate() - 1)), priority: 'medium', category: 'Personal', completed: true }
            ];
        }

        if (storedCategories) {
            categories = JSON.parse(storedCategories);
        }

        renderAllTasks();
        updateProgressBar();
    };

    // --- Utility Functions ---
    const displayConfirmationMessage = (element, message) => {
        element.textContent = message;
        element.classList.add('show');
        setTimeout(() => {
            element.classList.remove('show');
        }, 2000);
    };

    // --- Task Rendering and Manipulation ---

    // Function to create a task card HTML element
    const createTaskCard = (task) => {
        const taskCard = document.createElement('div');
        taskCard.classList.add('task-card', `priority-${task.priority}`);
        if (task.completed) {
            taskCard.classList.add('completed');
        }
        taskCard.setAttribute('data-id', task.id);
        taskCard.setAttribute('draggable', 'true'); // Make draggable

        // Blinking reminder for nearing deadline
        const now = new Date();
        // Task due within the next 2 hours, and not completed
        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        if (task.dueDate && task.dueDate > now && task.dueDate <= twoHoursLater && !task.completed) {
            taskCard.classList.add('nearing-deadline');
        } else {
            taskCard.classList.remove('nearing-deadline'); // Ensure it's removed if not applicable
        }

        const formattedDueDate = task.dueDate ?
            new Date(task.dueDate).toLocaleString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }) : 'No due date';

        taskCard.innerHTML = `
            <div class="task-header">
                <span class="task-title">${task.title}</span>
                <div class="task-actions">
                    <button class="complete-btn" title="Mark as Complete/Pending"><i class="fas fa-check-circle"></i></button>
                    <button class="edit-btn" title="Edit Task"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="Delete Task"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
            ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
            <div class="task-meta">
                <span><i class="far fa-calendar-alt"></i> Due: ${formattedDueDate}</span>
                <span><i class="fas fa-exclamation-triangle"></i> Priority: <span class="priority-level">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span></span>
            </div>
        `;

        // Event Listeners for actions
        taskCard.querySelector('.complete-btn').addEventListener('click', () => toggleTaskComplete(task.id));
        taskCard.querySelector('.edit-btn').addEventListener('click', () => openEditModal(task.id));
        taskCard.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

        // Drag and Drop listeners
        taskCard.addEventListener('dragstart', handleDragStart);
        taskCard.addEventListener('dragend', handleDragEnd);

        return taskCard;
    };

    // Function to render tasks for a specific category
    const renderTasksForCategory = (categoryName) => {
        const containerId = `tasks-${categoryName.toLowerCase().replace(/\s/g, '-')}`;
        const taskContainer = document.getElementById(containerId);
        if (!taskContainer) return;

        taskContainer.innerHTML = ''; // Clear existing tasks

        const filteredTasks = tasks.filter(task =>
            task.category === categoryName &&
            (task.title.toLowerCase().includes(searchInput.value.toLowerCase()) ||
             (task.description && task.description.toLowerCase().includes(searchInput.value.toLowerCase()))) &&
            (filterStatusSelect.value === 'all' ||
             (filterStatusSelect.value === 'completed' && task.completed) ||
             (filterStatusSelect.value === 'pending' && !task.completed)) &&
            (filterDateInput.value === '' ||
             (task.dueDate && new Date(task.dueDate).toDateString() === new Date(filterDateInput.value).toDateString()))
        ).sort((a, b) => {
            // Sort by completion status (incomplete first), then by due date
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            return 0; // No due date, maintain current order
        });


        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.classList.add('empty-category-message');
            emptyMessage.textContent = `No tasks in the '${categoryName}' category, or no tasks matching your filters.`;
            taskContainer.appendChild(emptyMessage);
        } else {
            filteredTasks.forEach(task => {
                taskContainer.appendChild(createTaskCard(task));
            });
        }
    };

    // Function to render all tasks across all categories
    const renderAllTasks = () => {
        taskListsContainer.innerHTML = ''; // Clear all existing category sections

        categories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.classList.add('task-list-category');
            categoryElement.setAttribute('data-category', category.toLowerCase().replace(/\s/g, '-'));

            categoryElement.innerHTML = `
                <div class="category-header">
                    <h2>${category} Tasks</h2>
                    <div>
                        <button class="edit-category-btn" title="Rename Category" data-category="${category}"><i class="fas fa-edit"></i></button>
                        <button class="delete-category-btn" title="Delete Category" data-category="${category}"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
                <div class="task-cards-container" id="tasks-${category.toLowerCase().replace(/\s/g, '-')}" >
                    </div>
            `;
            taskListsContainer.appendChild(categoryElement);

            // Add event listeners for category buttons
            categoryElement.querySelector('.edit-category-btn').addEventListener('click', (e) => {
                const oldCategoryName = e.currentTarget.dataset.category;
                const newCategoryName = prompt(`Rename category "${oldCategoryName}":`, oldCategoryName);
                if (newCategoryName && newCategoryName.trim() !== '' && newCategoryName !== oldCategoryName) {
                    renameCategory(oldCategoryName, newCategoryName.trim());
                }
            });
            categoryElement.querySelector('.delete-category-btn').addEventListener('click', (e) => {
                const categoryToDelete = e.currentTarget.dataset.category;
                if (confirm(`Are you sure you want to delete the category "${categoryToDelete}" and all its tasks?`)) {
                    deleteCategory(categoryToDelete);
                }
            });

            // Add dragover and drop listeners to task containers
            const taskContainer = categoryElement.querySelector('.task-cards-container');
            taskContainer.addEventListener('dragover', handleDragOver);
            taskContainer.addEventListener('drop', handleDrop);

            renderTasksForCategory(category);
        });
        populateCategorySelect(); // Update category dropdowns
    };

    // --- Task Operations ---
    const addTask = () => {
        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        const dueDate = taskDueDateInput.value ? new Date(taskDueDateInput.value) : null;
        const priority = taskPrioritySelect.value;
        let category = taskCategorySelect.value;

        if (title === '') {
            alert('Task title cannot be empty!');
            return;
        }

        // If 'Add New Category' was selected, prompt for new category name
        if (category === 'add-new-category') {
            const newCategoryName = prompt('Enter new category name:');
            if (newCategoryName && newCategoryName.trim() !== '') {
                category = newCategoryName.trim();
                if (!categories.includes(category)) {
                    addNewCategory(category); // Add to categories array and re-render all categories
                }
            } else {
                alert('New category name cannot be empty.');
                return; // Stop if no valid new category name
            }
        }

        const newTask = {
            id: Date.now(), // Simple unique ID
            title,
            description,
            dueDate,
            priority,
            category,
            completed: false
        };

        tasks.push(newTask);
        saveTasks();
        renderTasksForCategory(category); // Re-render only the affected category
        updateProgressBar();
        displayConfirmationMessage(addTaskMessage, 'Task added successfully!');

        // Clear inputs
        taskTitleInput.value = '';
        taskDescriptionInput.value = '';
        taskDueDateInput.value = '';
        taskPrioritySelect.value = 'low';
        // Keep selected category or reset to default
        if (taskCategorySelect.value === 'add-new-category') {
            taskCategorySelect.value = categories[0] || 'General';
        }
    };

    const toggleTaskComplete = (id) => {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex > -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            renderTasksForCategory(tasks[taskIndex].category); // Re-render the category
            updateProgressBar();
            if (tasks[taskIndex].completed) {
                showMotivationalQuote();
            }
        }
    };

    const deleteTask = (id) => {
        const taskToDelete = tasks.find(task => task.id === id);
        if (confirm(`Are you sure you want to delete "${taskToDelete.title}"?`)) {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasksForCategory(taskToDelete.category); // Re-render the category
            updateProgressBar();
        }
    };

    let currentEditingTaskId = null; // To store the ID of the task being edited

    const openEditModal = (id) => {
        currentEditingTaskId = id;
        const taskToEdit = tasks.find(task => task.id === id);
        if (!taskToEdit) return;

        modalTitle.textContent = `Edit Task: "${taskToEdit.title}"`;
        editTaskTitleInput.value = taskToEdit.title;
        editTaskDescriptionInput.value = taskToEdit.description;
        // Format date for datetime-local input
        editTaskDueDateInput.value = taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().slice(0, 16) : '';
        editTaskPrioritySelect.value = taskToEdit.priority;

        modal.style.display = 'flex'; // Show modal
    };

    const saveEditedTask = () => {
        if (!currentEditingTaskId) return;

        const taskIndex = tasks.findIndex(task => task.id === currentEditingTaskId);
        if (taskIndex > -1) {
            tasks[taskIndex].title = editTaskTitleInput.value.trim();
            tasks[taskIndex].description = editTaskDescriptionInput.value.trim();
            tasks[taskIndex].dueDate = editTaskDueDateInput.value ? new Date(editTaskDueDateInput.value) : null;
            tasks[taskIndex].priority = editTaskPrioritySelect.value;

            saveTasks();
            renderTasksForCategory(tasks[taskIndex].category); // Re-render the original category
            displayConfirmationMessage(editTaskMessage, 'Task updated successfully!');
            setTimeout(closeModal, 1500); // Close modal after showing message
        }
    };

    const closeModal = () => {
        modal.style.display = 'none';
        currentEditingTaskId = null;
        editTaskMessage.classList.remove('show'); // Hide any messages
    };

    // --- Category Management ---
    const populateCategorySelect = () => {
        taskCategorySelect.innerHTML = ''; // Clear existing options
        categories.sort().forEach(category => { // Sort categories alphabetically
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            taskCategorySelect.appendChild(option);
        });
        const addNewOption = document.createElement('option');
        addNewOption.value = 'add-new-category';
        addNewOption.textContent = '-- Add New Category --';
        taskCategorySelect.appendChild(addNewOption);
    };

    const addNewCategory = (categoryName) => {
        if (categoryName && !categories.includes(categoryName)) {
            categories.push(categoryName);
            saveTasks();
            renderAllTasks(); // Re-render to show new category section
            populateCategorySelect(); // Update dropdown
            taskCategorySelect.value = categoryName; // Select the newly added category
        }
    };

    const renameCategory = (oldName, newName) => {
        const index = categories.indexOf(oldName);
        if (index > -1) {
            // Check if the new name already exists
            if (categories.includes(newName) && newName !== oldName) {
                alert('Category name already exists.');
                return;
            }

            categories[index] = newName;
            // Update all tasks belonging to the old category
            tasks.forEach(task => {
                if (task.category === oldName) {
                    task.category = newName;
                }
            });
            saveTasks();
            renderAllTasks();
            populateCategorySelect(); // Update dropdown
        }
    };

    const deleteCategory = (categoryName) => {
        // Prevent deleting if tasks exist in it
        const tasksInCategory = tasks.filter(task => task.category === categoryName);
        if (tasksInCategory.length > 0) {
            alert(`Cannot delete category "${categoryName}" because it contains ${tasksInCategory.length} task(s). Please move or delete the tasks first.`);
            return;
        }

        categories = categories.filter(cat => cat !== categoryName);
        saveTasks();
        renderAllTasks();
        populateCategorySelect();
    };

    // --- Filtering and Searching ---
    const applyFilters = () => {
        renderAllTasks(); // Rerender all tasks based on current filter/search
    };

    // --- Drag and Drop Reordering ---
    let draggedTask = null;

    const handleDragStart = (e) => {
        draggedTask = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.dataset.id); // Set task ID for transfer
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('dragging');
        draggedTask = null;
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Allow drop
        const targetContainer = e.currentTarget;
        const draggable = document.querySelector('.dragging');

        // Prevent dragging to a container that doesn't contain the dragged element if it's the same category
        if (draggable && targetContainer.id === `tasks-${draggedTask.closest('.task-list-category').dataset.category}`) {
            const afterElement = getDragAfterElement(targetContainer, e.clientY);
            if (afterElement == null) {
                targetContainer.appendChild(draggable);
            } else {
                targetContainer.insertBefore(draggable, afterElement);
            }
        }
    };

    const getDragAfterElement = (container, y) => {
        const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const taskId = parseInt(e.dataTransfer.getData('text/plain'));
        const draggedElement = document.querySelector(`[data-id="${taskId}"]`);
        const targetCategoryElement = e.currentTarget.closest('.task-list-category');
        const newCategoryName = targetCategoryElement.querySelector('h2').textContent.replace(' Tasks', ''); // Get full category name

        // Find the task in the tasks array
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return; // Task not found

        const oldCategory = tasks[taskIndex].category;

        // If category changed
        if (oldCategory !== newCategoryName) {
            tasks[taskIndex].category = newCategoryName;
            saveTasks();
            renderAllTasks(); // Re-render all to update both old and new categories
        } else {
            // If category did not change, reorder within the same category
            // Get the current DOM order of tasks in the target container
            const currentTasksInContainer = Array.from(e.currentTarget.children)
                .map(card => parseInt(card.dataset.id));

            // Filter out tasks not in this category from the global array
            const otherTasks = tasks.filter(t => t.category !== oldCategory);
            // Reorder tasks within this category based on the DOM order
            const reorderedCategoryTasks = currentTasksInContainer
                .map(id => tasks.find(t => t.id === id))
                .filter(Boolean); // Filter out any potential nulls if an ID wasn't found

            // Combine back into the global tasks array
            tasks = [...otherTasks, ...reorderedCategoryTasks];
            saveTasks();
            // No need to re-render all tasks if only reordering within a category;
            // the DOM is already updated by drag-and-drop.
            // However, a simple renderTasksForCategory(oldCategory) would re-apply sorting/filters.
            renderTasksForCategory(oldCategory);
        }
    };


    // --- Progress Bar (Bonus) ---
    const updateProgressBar = () => {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const percentage = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${Math.round(percentage)}% Completed`;
    };

    // --- Dark Mode Toggle (Bonus) ---
    const toggleDarkMode = () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
    };

    const loadDarkModeSetting = () => {
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        }
    };

    // --- Motivational Quotes (Bonus) ---
    const motivationalQuotes = [
        "You're making great progress!",
        "Awesome job! Keep going!",
        "Every step counts. Well done!",
        "Productivity pro in the making!",
        "Another task conquered. Fantastic!",
        "You're unstoppable!",
        "Success is the sum of small efforts repeated daily.",
        "The best way to get started is to quit talking and begin doing."
    ];

    const showMotivationalQuote = () => {
        const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
        quoteToast.textContent = motivationalQuotes[randomIndex];
        quoteToast.classList.add('show');
        setTimeout(() => {
            quoteToast.classList.remove('show');
        }, 3000); // Hide after 3 seconds
    };

    // --- Initializations and Event Listeners ---
    addTaskBtn.addEventListener('click', addTask);
    searchInput.addEventListener('input', applyFilters);
    filterStatusSelect.addEventListener('change', applyFilters);
    filterDateInput.addEventListener('change', applyFilters);
    clearFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterStatusSelect.value = 'all';
        filterDateInput.value = '';
        applyFilters();
    });

    darkModeToggle.addEventListener('change', toggleDarkMode);
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { // Close modal when clicking outside content
        if (e.target === modal) {
            closeModal();
        }
    });
    saveEditBtn.addEventListener('click', saveEditedTask);

    // Initial load
    loadDarkModeSetting();
    loadTasks();
    populateCategorySelect(); // Initial population of categories for input select

    // Set up interval for blinking reminder (e.g., every minute)
    setInterval(() => {
        tasks.forEach(task => {
            const taskCard = document.querySelector(`.task-card[data-id="${task.id}"]`);
            if (taskCard) {
                const now = new Date();
                const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                if (task.dueDate && new Date(task.dueDate) > now && new Date(task.dueDate) <= twoHoursLater && !task.completed) {
                    taskCard.classList.add('nearing-deadline');
                } else {
                    taskCard.classList.remove('nearing-deadline');
                }
            }
        });
    }, 60 * 1000); // Check every minute
});