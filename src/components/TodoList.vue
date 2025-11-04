<template>
  <div class="todo-app">
    <header class="app-header">
      <h1>📝 Мой Todo List</h1>
      <p>Организуй свои задачи</p>
      
      <div class="storage-info">
        <transition name="fade">
          <span v-if="isLoadedFromStorage" class="load-message">
            ✅ Данные загружены из сохранённой сессии
          </span>
        </transition>
        
        <div class="storage-actions">
          <button 
            v-if="completedCount > 0"
            @click="clearCompleted" 
            class="action-button danger"
            title="Удалить все выполненные задачи"
          >
            🗑️ Очистить выполненные ({{ completedCount }})
          </button>
          <button 
            @click="clearAllData" 
            class="action-button danger"
            title="Очистить все данные"
          >
            🗑️ Очистить всё
          </button>
        </div>
      </div>
    </header>

    <!-- Статистика -->
    <div class="stats">
      <div class="stat-item">
        <span class="stat-number">{{ todos.length }}</span>
        <span class="stat-label">Всего</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ activeCount }}</span>
        <span class="stat-label">Активных</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ completedCount }}</span>
        <span class="stat-label">Выполнено</span>
      </div>
      <div class="stat-item" v-if="completedCount > 0">
        <span class="stat-number">{{ completionPercentage }}%</span>
        <span class="stat-label">Прогресс</span>
      </div>
    </div>

    <!-- Поиск и сортировка -->
    <div class="controls">
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Поиск задач..."
          class="search-input"
        >
        <span class="search-icon">🔍</span>
      </div>
      
      <div class="sort-controls">
        <label>Сортировка:</label>
        <select v-model="sortBy" class="sort-select">
          <option value="createdAt">По дате</option>
          <option value="text">По тексту</option>
          <option value="completed">По статусу</option>
        </select>
      </div>
    </div>

    <!-- Форма для добавления задач -->
    <div class="add-todo">
      <input 
        v-model="newTodoText" 
        type="text" 
        placeholder="Что нужно сделать?"
        class="todo-input"
        @keyup.enter="handleAddTodo"
        :class="{ error: showError }"
      >
      <button 
        @click="handleAddTodo" 
        class="add-button"
        :disabled="!newTodoText.trim()"
      >
        <span v-if="!isAdding">➕ Добавить</span>
        <span v-else>⏳ Добавляем...</span>
      </button>
    </div>
    
    <transition name="slide-fade">
      <div v-if="showError" class="error-message">
        ❌ Пожалуйста, введите текст задачи
      </div>
    </transition>

    <!-- Фильтры -->
    <div class="filters">
      <button 
        @click="currentFilter = 'all'"
        :class="{ active: currentFilter === 'all' }"
        class="filter-button"
      >
        Все ({{ todos.length }})
      </button>
      <button 
        @click="currentFilter = 'active'"
        :class="{ active: currentFilter === 'active' }"
        class="filter-button"
      >
        Активные ({{ activeCount }})
      </button>
      <button 
        @click="currentFilter = 'completed'"
        :class="{ active: currentFilter === 'completed' }"
        class="filter-button"
      >
        Выполненные ({{ completedCount }})
      </button>
    </div>

    <!-- Список задач -->
    <transition-group name="todo-list" tag="div" class="todos-container">
      <div 
        v-for="todo in filteredTodos" 
        :key="todo.id" 
        class="todo-item"
        :class="{ 
          completed: todo.completed,
          editing: editingId === todo.id
        }"
      >
        <!-- Чекбокс для отметки выполнения -->
        <input 
          type="checkbox" 
          v-model="todo.completed"
          class="todo-checkbox"
          :disabled="editingId === todo.id"
        >
        
        <!-- Отображение текста задачи (режим просмотра) -->
        <span 
          v-if="editingId !== todo.id"
          class="todo-text"
          @dblclick="startEditing(todo)"
          :title="'Двойной клик для редактирования'"
        >
          {{ todo.text }}
          <span class="todo-date" v-if="todo.createdAt">
            {{ formatDate(todo.createdAt) }}
          </span>
        </span>
        
        <!-- Поле редактирования (режим редактирования) -->
        <div v-else class="edit-container">
          <input
            type="text"
            v-model="editingText"
            @keyup.enter="saveEdit(todo)"
            @keyup.escape="cancelEdit"
            class="edit-input"
            ref="editInputRef"
          >
          <div class="edit-actions">
            <button @click="saveEdit(todo)" class="save-button" title="Сохранить">
              ✅
            </button>
            <button @click="cancelEdit" class="cancel-button" title="Отменить">
              ❌
            </button>
          </div>
        </div>
        
        <!-- Кнопки действий (только в режиме просмотра) -->
        <div v-if="editingId !== todo.id" class="todo-actions">
          <button 
            class="edit-button" 
            @click="startEditing(todo)" 
            title="Редактировать"
          >
            ✏️
          </button>
          <button 
            class="delete-button" 
            @click="confirmDelete(todo)" 
            title="Удалить"
          >
            🗑️
          </button>
        </div>
      </div>
    </transition-group>

    <!-- Сообщение когда нет задач -->
    <transition name="fade">
      <div v-if="filteredTodos.length === 0" class="empty-state">
        <div v-if="searchQuery" class="empty-search">
          <p>🔍 Не найдено задач по запросу "{{ searchQuery }}"</p>
          <button @click="searchQuery = ''" class="clear-search-button">
            Очистить поиск
          </button>
        </div>
        <div v-else>
          <p v-if="currentFilter === 'all'">🎉 Пока нет задач. Добавь первую!</p>
          <p v-else-if="currentFilter === 'active'">🎉 Нет активных задач!</p>
          <p v-else>📝 Нет выполненных задач</p>
        </div>
      </div>
    </transition>

    <!-- Подсказка -->
    <div class="hint">
      <p>💡 Данные автоматически сохраняются в браузере</p>
      <p>💡 Двойной клик по задаче для быстрого редактирования</p>
    </div>

    <!-- Диалог подтверждения удаления -->
    <transition name="modal">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete">
        <div class="modal">
          <h3>Подтверждение удаления</h3>
          <p>Вы уверены, что хотите удалить задачу "{{ todoToDelete?.text }}"?</p>
          <div class="modal-actions">
            <button @click="confirmDeleteAction" class="confirm-button danger">
              Да, удалить
            </button>
            <button @click="cancelDelete" class="cancel-button">
              Отмена
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useTodos } from '../composables/useTodos'

// Используем наш композабл для задач
const {
  todos,
  currentFilter,
  searchQuery,
  sortBy,
  completedCount,
  activeCount,
  filteredTodos,
  addTodo,
  deleteTodo,
  updateTodo,
  toggleTodo,
  clearCompleted,
  clearStorage
} = useTodos()

// Локальные реактивные переменные
const newTodoText = ref('')
const editingId = ref(null)
const editingText = ref('')
const editInputRef = ref(null)
const showError = ref(false)
const isAdding = ref(false)
const isLoadedFromStorage = ref(false)
const showDeleteModal = ref(false)
const todoToDelete = ref(null)

// Вычисляемые свойства
const completionPercentage = computed(() => {
  if (todos.value.length === 0) return 0
  return Math.round((completedCount.value / todos.value.length) * 100)
})

// Функции
const handleAddTodo = async () => {
  if (newTodoText.value.trim() === '') {
    showError.value = true
    setTimeout(() => {
      showError.value = false
    }, 3000)
    return
  }
  
  isAdding.value = true
  // Имитируем небольшую задержку для лучшего UX
  await new Promise(resolve => setTimeout(resolve, 300))
  
  addTodo(newTodoText.value)
  newTodoText.value = ''
  isAdding.value = false
}

const startEditing = (todo) => {
  editingText.value = todo.text
  editingId.value = todo.id
  
  nextTick(() => {
    if (editInputRef.value) {
      editInputRef.value.focus()
      editInputRef.value.select()
    }
  })
}

const saveEdit = (todo) => {
  if (editingText.value.trim() === '') {
    confirmDelete(todo)
  } else {
    updateTodo(todo.id, { text: editingText.value.trim() })
  }
  editingId.value = null
  editingText.value = ''
}

const cancelEdit = () => {
  editingId.value = null
  editingText.value = ''
}

const confirmDelete = (todo) => {
  todoToDelete.value = todo
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  todoToDelete.value = null
}

const confirmDeleteAction = () => {
  if (todoToDelete.value) {
    deleteTodo(todoToDelete.value.id)
    cancelDelete()
  }
}

const clearAllData = () => {
  if (confirm('Вы уверены, что хотите удалить ВСЕ задачи? Это действие нельзя отменить.')) {
    clearStorage()
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  })
}

// Инициализация
import { onMounted } from 'vue'
onMounted(() => {
  if (todos.value.length > 0) {
    isLoadedFromStorage.value = true
    setTimeout(() => {
      isLoadedFromStorage.value = false
    }, 3000)
  }
})
</script>

<style scoped>
/* Базовые стили остаются */
.todo-app {
  max-width: 700px;
  width: 100%;
  margin: 0 auto;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 25px;
  position: relative;
}

/* Анимации */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

.todo-list-enter-active,
.todo-list-leave-active {
  transition: all 0.4s ease;
}

.todo-list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.todo-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.todo-list-move {
  transition: transform 0.4s ease;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal {
  transform: scale(0.9);
}

.modal-leave-to .modal {
  transform: scale(1.1);
}

/* Обновлённая статистика */
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: white;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
  text-transform: uppercase;
}

/* Элементы управления */
.controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 15px;
  border: 2px solid #e9ecef;
  border-radius: 25px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #42b883;
}

.search-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.sort-select {
  padding: 8px 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  cursor: pointer;
}

/* Кнопки действий */
.action-button {
  padding: 8px 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.action-button.danger {
  background: #dc3545;
  color: white;
}

.action-button.danger:hover {
  background: #c82333;
  transform: translateY(-2px);
}

.storage-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

/* Обновлённые задачи */
.todo-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-bottom: 1px solid #f8f9fa;
  transition: all 0.3s;
  background: white;
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.todo-item:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.todo-text {
  flex: 1;
  position: relative;
  padding-right: 80px;
}

.todo-date {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 10px;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal {
  background: white;
  padding: 25px;
  border-radius: 15px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.modal p {
  margin-bottom: 25px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* Сообщения */
.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 10px 15px;
  border-radius: 8px;
  margin: 10px 0;
  border-left: 4px solid #dc3545;
}

.load-message {
  background: #d4edda;
  color: #155724;
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 14px;
}

.empty-search {
  text-align: center;
}

.clear-search-button {
  margin-top: 10px;
  padding: 8px 15px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.clear-search-button:hover {
  background: #545b62;
}

/* Адаптивность */
@media (max-width: 768px) {
  .todo-app {
    margin: 10px;
    padding: 15px;
  }
  
  .controls {
    flex-direction: column;
  }
  
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .storage-actions {
    flex-direction: column;
  }
  
  .todo-text {
    padding-right: 0;
  }
  
  .todo-date {
    position: static;
    display: block;
    margin-top: 5px;
    transform: none;
  }
}
</style>
