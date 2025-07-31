import React, { useState, useEffect } from 'react';
import { Plus, Clock, AlertCircle, Calendar, Star, Play, Trash2, Pause, Square, Repeat } from 'lucide-react';

const TaskManager = () => {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'タスクを登録する',
      duration: 3,
      shouldDoAt: null,
      usuallyDoAt: null,
      priority: 3,
      category: '日常',
      completed: false,
      isRunning: false,
      startTime: null,
      elapsedTime: 0,
      autoComplete: false,
      isRecurring: false,
      recurringType: null,
      recurringDays: [],
      lastCompleted: null
    }
  ]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAddTask, setShowAddTask] = useState(false);
  const [playedTimeEndSounds, setPlayedTimeEndSounds] = useState(new Set());
  const [newTask, setNewTask] = useState({
    title: '',
    duration: 15,
    shouldDoAt: '',
    usuallyDoAt: '',
    priority: 3,
    category: '家事',
    autoComplete: false,
    isRecurring: false,
    recurringType: 'daily',
    recurringDays: []
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // 繰り返しタスクのリセットチェック
      setTasks(prevTasks => 
        prevTasks.map(task => {
          if (task.isRecurring && task.completed && shouldResetRecurringTask(task)) {
            return {
              ...task,
              completed: false,
              isRunning: false,
              startTime: null,
              elapsedTime: 0,
              lastCompleted: null
            };
          }
          return task;
        })
      );
      
      // 実行中のタスクの経過時間を更新
      setTasks(prevTasks => 
        prevTasks.map(task => {
          if (task.isRunning && task.startTime) {
            const elapsed = Math.floor((Date.now() - task.startTime) / 1000); // 秒
            const totalSeconds = task.duration * 60;
            
            // 時間終了の音（自動完了でないタスクのみ）
            if (elapsed >= totalSeconds && !task.autoComplete && !playedTimeEndSounds.has(task.id)) {
              playSound(800, 200, 'beep');
              setPlayedTimeEndSounds(prev => new Set([...prev, task.id]));
            }
            
            // タスク完了チェック（自動完了が有効な場合のみ）
            if (elapsed >= totalSeconds && task.autoComplete) {
              playSound(1000, 300, 'complete');
              return {
                ...task,
                completed: true,
                isRunning: false,
                elapsedTime: totalSeconds,
                lastCompleted: task.isRecurring ? new Date().toDateString() : null
              };
            }
            
            return {
              ...task,
              elapsedTime: elapsed
            };
          }
          return task;
        })
      );
    }, 1000); // 1秒ごとに更新

    return () => clearInterval(timer);
  }, [playedTimeEndSounds]);

  const timeToMinutes = (datetimeStr) => {
    if (!datetimeStr) return null;
    const date = new Date(datetimeStr);
    return date.getTime(); // ミリ秒で返す
  };

  const getCurrentMinutes = () => {
    return currentTime.getTime(); // 現在時刻をミリ秒で返す
  };

  const shouldResetRecurringTask = (task) => {
    if (!task.lastCompleted) return false;
    
    const today = new Date().toDateString();
    const lastCompletedDate = task.lastCompleted;
    
    if (lastCompletedDate === today) return false; // 今日完了済み
    
    const dayOfWeek = new Date().getDay(); // 0=日曜日, 1=月曜日, ...
    
    switch (task.recurringType) {
      case 'daily':
        return true;
      case 'weekdays':
        return dayOfWeek >= 1 && dayOfWeek <= 5; // 月-金
      case 'weekends':
        return dayOfWeek === 0 || dayOfWeek === 6; // 土日
      case 'custom':
        return task.recurringDays.includes(dayOfWeek);
      default:
        return false;
    }
  };

  const calculateTaskScore = (task) => {
    if (task.completed) return -1000;
    
    let score = 0;
    const currentTimeMs = getCurrentMinutes();
    
    // 基本優先度
    score += task.priority * 20;
    
    // やるべき日時との差
    if (task.shouldDoAt) {
      const shouldDoTime = timeToMinutes(task.shouldDoAt);
      const timeDiff = Math.abs(currentTimeMs - shouldDoTime) / (1000 * 60); // 分単位に変換
      if (currentTimeMs >= shouldDoTime) {
        // 過ぎている場合はスコアを高くする
        score += Math.max(0, 100 - timeDiff / 2);
      } else {
        // まだ早い場合は時間が近いほどスコアを高くする
        score += Math.max(0, 50 - timeDiff / 4);
      }
    }
    
    // 普段やっている日時との差
    if (task.usuallyDoAt) {
      const usuallyDoTime = timeToMinutes(task.usuallyDoAt);
      const timeDiff = Math.abs(currentTimeMs - usuallyDoTime) / (1000 * 60); // 分単位に変換
      score += Math.max(0, 30 - timeDiff / 6);
    }
    
    // 短時間タスクにボーナス（隙間時間活用）
    if (task.duration <= 10) {
      score += 15;
    }
    
    return score;
  };

  // 音を再生する関数
  const playSound = (frequency = 800, duration = 200, type = 'beep') => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'complete') {
        // 完了音：高い音から低い音へ
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        duration = 300;
      } else {
        // 時間終了音：短いビープ音
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      }
      
      oscillator.type = 'sine';
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.log('音声再生に失敗しました:', error);
    }
  };

  const sortedTasks = [...tasks]
    .map(task => ({
      ...task,
      score: calculateTaskScore(task)
    }))
    .sort((a, b) => {
      // 完了済みタスクを最下位に
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      
      // 実行中のタスクを最優先（未完了タスクの中で）
      if (!a.completed && !b.completed) {
        if (a.isRunning && !b.isRunning) return -1;
        if (!a.isRunning && b.isRunning) return 1;
      }
      
      // 両方とも同じ状態の場合はスコアでソート
      return b.score - a.score;
    });

  const toggleTask = (id) => {
    const task = tasks.find(t => t.id === id);
    
    // 手動完了時の音
    if (task && !task.completed) {
      playSound(1000, 300, 'complete');
    }
    
    setTasks(tasks.map(task => 
      task.id === id ? { 
        ...task, 
        completed: !task.completed,
        lastCompleted: task.isRecurring && !task.completed ? new Date().toDateString() : task.lastCompleted
      } : task
    ));
  };

  const startTask = (id) => {
    // 既に時間終了音を再生したタスクの記録をリセット
    setPlayedTimeEndSounds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    
    setTasks(tasks.map(task => 
      task.id === id 
        ? { 
            ...task, 
            isRunning: true, 
            startTime: Date.now(),
            elapsedTime: 0
          } 
        : { ...task, isRunning: false } // 他のタスクは停止
    ));
  };

  const pauseTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, isRunning: false } : task
    ));
  };

  const stopTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id 
        ? { 
            ...task, 
            isRunning: false, 
            startTime: null,
            elapsedTime: 0
          } 
        : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const addTask = () => {
    if (newTask.title.trim()) {
      const task = {
        ...newTask,
        id: Date.now(),
        completed: false,
        isRunning: false,
        startTime: null,
        elapsedTime: 0,
        autoComplete: newTask.autoComplete,
        isRecurring: newTask.isRecurring,
        recurringType: newTask.isRecurring ? newTask.recurringType : null,
        recurringDays: newTask.isRecurring ? newTask.recurringDays : [],
        lastCompleted: null
      };
      setTasks([...tasks, task]);
      setNewTask({
        title: '',
        duration: 15,
        shouldDoAt: '',
        usuallyDoAt: '',
        priority: 3,
        category: '家事',
        autoComplete: false,
        isRecurring: false,
        recurringType: 'daily',
        recurringDays: []
      });
      setShowAddTask(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      1: 'text-gray-500',
      2: 'text-blue-500',
      3: 'text-yellow-500',
      4: 'text-orange-500',
      5: 'text-red-500'
    };
    return colors[priority] || 'text-gray-500';
  };

  const getCategoryColor = (category) => {
    const colors = {
      '家事': 'bg-green-100 text-green-800',
      '予定': 'bg-blue-100 text-blue-800',
      '日常': 'bg-gray-100 text-gray-800',
      '娯楽': 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getProgressPercentage = (task) => {
    if (!task.isRunning && task.elapsedTime === 0) return 0;
    const totalSeconds = task.duration * 60;
    return Math.min((task.elapsedTime / totalSeconds) * 100, 100);
  };

  const getRemainingTime = (task) => {
    const totalSeconds = task.duration * 60;
    const remaining = totalSeconds - task.elapsedTime;
    if (remaining <= 0) {
      return task.autoComplete ? '完了' : '時間終了';
    }
    
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto" style={{ fontFamily: '"M PLUS Rounded 1c", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif' }}>
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">ルーマニアタスクシステム</h1>
            <p className="text-sm text-gray-600">
              {currentTime.toLocaleTimeString('ja-JP', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
          <button
            onClick={() => setShowAddTask(!showAddTask)}
            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* タスク追加フォーム */}
      {showAddTask && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 animate-in slide-in-from-top duration-200">
          <h2 className="font-semibold mb-3">新しいタスク</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="タスク名"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600">所要時間(分)</label>
                <input
                  type="number"
                  value={newTask.duration}
                  onChange={(e) => setNewTask({...newTask, duration: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">優先度</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>低</option>
                  <option value={2}>やや低</option>
                  <option value={3}>普通</option>
                  <option value={4}>高</option>
                  <option value={5}>最高</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600">やるべき日時</label>
                <input
                  type="datetime-local"
                  value={newTask.shouldDoAt}
                  onChange={(e) => setNewTask({...newTask, shouldDoAt: e.target.value})}
                  className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">普段の日時</label>
                <input
                  type="datetime-local"
                  value={newTask.usuallyDoAt}
                  onChange={(e) => setNewTask({...newTask, usuallyDoAt: e.target.value})}
                  className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={newTask.category}
              onChange={(e) => setNewTask({...newTask, category: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="家事">家事</option>
              <option value="予定">予定</option>
              <option value="日常">日常</option>
              <option value="娯楽">娯楽</option>
            </select>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoComplete"
                checked={newTask.autoComplete}
                onChange={(e) => setNewTask({...newTask, autoComplete: e.target.checked})}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="autoComplete" className="text-sm text-gray-700">
                時間終了時に自動完了する
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={newTask.isRecurring}
                onChange={(e) => setNewTask({...newTask, isRecurring: e.target.checked})}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isRecurring" className="text-sm text-gray-700">
                繰り返しタスク
              </label>
            </div>
            {newTask.isRecurring && (
              <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                <div>
                  <label className="text-xs text-gray-600">繰り返しパターン</label>
                  <select
                    value={newTask.recurringType}
                    onChange={(e) => setNewTask({...newTask, recurringType: e.target.value, recurringDays: []})}
                    className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="daily">毎日</option>
                    <option value="weekdays">平日のみ</option>
                    <option value="weekends">週末のみ</option>
                    <option value="custom">カスタム</option>
                  </select>
                </div>
                {newTask.recurringType === 'custom' && (
                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">繰り返す曜日</label>
                    <div className="grid grid-cols-7 gap-1">
                      {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            const days = newTask.recurringDays.includes(index) 
                              ? newTask.recurringDays.filter(d => d !== index)
                              : [...newTask.recurringDays, index];
                            setNewTask({...newTask, recurringDays: days});
                          }}
                          className={`p-2 text-xs rounded ${
                            newTask.recurringDays.includes(index)
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={addTask}
                className="flex-1 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                追加
              </button>
              <button
                onClick={() => setShowAddTask(false)}
                className="flex-1 bg-gray-300 text-gray-700 p-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* タスクリスト */}
      <div>
        {sortedTasks.map((task, index) => (
          <div
            key={task.id}
            className={`bg-white rounded-lg shadow-sm overflow-hidden relative transition-all duration-300 ease-in-out transform ${
              task.completed ? 'opacity-50 scale-95' : 'scale-100'
            } ${task.isRunning ? 'ring-2 ring-green-500 shadow-lg scale-102' : ''} ${
              index === 0 ? 'mb-6' : 'mb-3'
            }`}
            style={{
              transform: `translateY(${index * 4}px)`,
            }}
          >
            {/* 進捗バー背景 */}
            {task.isRunning && (
              <div className="absolute inset-0 bg-green-50">
                <div 
                  className="h-full bg-green-200 transition-all duration-1000 ease-linear"
                  style={{ width: `${getProgressPercentage(task)}%` }}
                />
              </div>
            )}
            
            <div className="relative p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        task.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {task.completed && '✓'}
                    </button>
                    <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    {task.isRunning && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                        実行中
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{task.duration}分</span>
                    </div>
                    
                    {task.isRunning && (
                      <div className={`flex items-center gap-1 font-semibold ${
                        task.elapsedTime >= task.duration * 60 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        <span>残り: {getRemainingTime(task)}</span>
                        {!task.autoComplete && task.elapsedTime >= task.duration * 60 && (
                          <span className="text-xs bg-red-100 text-red-600 px-1 rounded">手動終了</span>
                        )}
                      </div>
                    )}
                    
                    {task.shouldDoAt && (
                      <div className="flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span className="text-xs">
                          {new Date(task.shouldDoAt).toLocaleString('ja-JP', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                    
                    {task.usuallyDoAt && (
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span className="text-xs">
                          {new Date(task.usuallyDoAt).toLocaleString('ja-JP', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block text-xs px-2 py-1 rounded-full ${getCategoryColor(task.category)}`}>
                        {task.category}
                      </span>
                      {task.isRecurring && (
                        <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          <Repeat size={10} />
                          {task.recurringType === 'daily' && '毎日'}
                          {task.recurringType === 'weekdays' && '平日'}
                          {task.recurringType === 'weekends' && '週末'}
                          {task.recurringType === 'custom' && 'カスタム'}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <Star size={12} className={getPriorityColor(task.priority)} />
                        <span className="text-xs text-gray-500">
                          優先度: {task.priority}
                        </span>
                      </div>
                    </div>
                    
                    {/* アクションボタン */}
                    <div className="flex items-center gap-1">
                      {!task.completed && (
                        <>
                          {!task.isRunning ? (
                            <button
                              onClick={() => startTask(task.id)}
                              className="p-1.5 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                              title="開始"
                            >
                              <Play size={14} />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => pauseTask(task.id)}
                                className="p-1.5 text-yellow-600 hover:bg-yellow-100 rounded-full transition-colors"
                                title="一時停止"
                              >
                                <Pause size={14} />
                              </button>
                              <button
                                onClick={() => stopTask(task.id)}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                title="停止"
                              >
                                <Square size={14} />
                              </button>
                            </>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                        title="削除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedTasks.filter(task => !task.completed).length === 0 && (
        <div className="text-center py-8 animate-in fade-in duration-500">
          <p className="text-gray-500">すべてのタスクが完了しました！🎉</p>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
