import { ref, computed } from 'vue'
import { useLocalStorage } from './useLocalStorage'

/**
 * Композабл для управления задачами
 */
export function useTodos() {
  const { data: todos, clear: clearStorage } = useLocalStorage('vue-todo-app', [])
  
  // Реактивные переменные
  const currentFilter = ref('all')
  const searchQuery = ref('')
  const sortBy = ref('createdAt')

  // Вычисляемые свойства
  const completedCount = computed(() => {
    return todos.value.filter(todo => todo.completed).length
  })

  const activeCount = computed(() => {
    return todos.value.filter(todo => !todo.completed).length
  })

  const filteredTodos = computed(() => {
    let filtered = todos.value
    
    // Применяем фильтр по статусу
    switch (currentFilter.value) {
      case 'active':
        filtered = filtered.filter(todo => !todo.completed)
        break
      case 'completed':
        filtered = filtered.filter(todo => todo.completed)
        break
      default:
        break
    }
    
    // Применяем поиск
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim()
      filtered = filtered.filter(todo => 
        todo.text.toLowerCase().includes(query)
      )
    }
    
    // Применяем сортировку
    return sortTodos(filtered, sortBy.value)
  })

  // Функции
  const addTodo = (text) => {
    if (!text.trim()) return null
    
    const newTodo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    todos.value.push(newTodo)
    return newTodo
  }

  const deleteTodo = (id) => {
    todos.value = todos.value.filter(todo => todo.id !== id)
  }

  const updateTodo = (id, updates) => {
    const todoIndex = todos.value.findIndex(todo => todo.id === id)
    if (todoIndex !== -1) {
      todos.value[todoIndex] = {
        ...todos.value[todoIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      }
    }
  }

  const toggleTodo = (id) => {
    const todo = todos.value.find(todo => todo.id === id)
    if (todo) {
      todo.completed = !todo.completed
      todo.updatedAt = new Date().toISOString()
    }
  }

  const clearCompleted = () => {
    todos.value = todos.value.filter(todo => !todo.completed)
  }

  const sortTodos = (todosArray, sortKey) => {
    const sorted = [...todosArray]
    
    switch (sortKey) {
      case 'text':
        return sorted.sort((a, b) => a.text.localeCompare(b.text))
      case 'completed':
        return sorted.sort((a, b) => {
          if (a.completed === b.completed) return 0
          return a.completed ? 1 : -1
        })
      case 'createdAt':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
  }

  return {
    // Данные
    todos,
    currentFilter,
    searchQuery,
    sortBy,
    
    // Вычисляемые свойства
    completedCount,
    activeCount,
    filteredTodos,
    
    // Методы
    addTodo,
    deleteTodo,
    updateTodo,
    toggleTodo,
    clearCompleted,
    clearStorage
  }
}