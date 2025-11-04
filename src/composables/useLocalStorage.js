import { ref, watch } from 'vue'

/**
 * Композабл для работы с Local Storage
 */
export function useLocalStorage(key, defaultValue) {
  // Создаём реактивную переменную с начальным значением из Local Storage
  const data = ref(getInitialValue())
  
  // Функция для получения начального значения
  function getInitialValue() {
    try {
      const item = window.localStorage.getItem(key)
      if (item === null) {
        window.localStorage.setItem(key, JSON.stringify(defaultValue))
        return defaultValue
      }
      return JSON.parse(item)
    } catch (error) {
      console.error(`Ошибка при чтении из Local Storage (${key}):`, error)
      return defaultValue
    }
  }
  
  // Функция для сохранения данных в Local Storage
  function saveToStorage() {
    try {
      window.localStorage.setItem(key, JSON.stringify(data.value))
    } catch (error) {
      console.error(`Ошибка при сохранении в Local Storage (${key}):`, error)
    }
  }
  
  // Функция для явного сохранения
  function save() {
    saveToStorage()
  }
  
  // Функция для очистки данных
  function clear() {
    data.value = defaultValue
    window.localStorage.removeItem(key)
  }
  
  // Автоматически сохраняем данные при их изменении
  watch(data, saveToStorage, { deep: true })
  
  return {
    data,
    save,
    clear
  }
}