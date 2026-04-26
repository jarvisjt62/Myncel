with open('app/dashboard/DashboardClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_section = '''          {activeTab === 'schedules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#425466]">{maintenanceTasks.length} tasks due this week</p>
                <button onClick={() => setShowTaskModal(true)} className="bg-[#635bff] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#4f46e5] transition-colors">
                  + Add Task
                </button>
              </div>
              {maintenanceTasks.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#e6ebf1] p-12 text-center">
                  <svg className="w-12 h-12 text-[#c0ccda] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-[#8898aa] text-sm">No maintenance tasks due in the next 7 days.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#e6ebf1] divide-y divide-[#e6ebf1]">
                  {maintenanceTasks.map((task) => (
                    <div key={task.id} className="px-5 py-4 flex items-center justify-between hover:bg-[#f6f9fc] transition-colors">
                      <div>
                        <p className="font-medium text-[#0a2540] text-sm">{task.title}</p>
                        <p className="text-xs text-[#8898aa] mt-0.5">{task.machine?.name ?? \'General\'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`text-sm font-medium ${task.nextDueAt && new Date(task.nextDueAt) < new Date() ? \'text-red-500\' : \'text-[#0a2540]\'}`}>
                          {formatDate(task.nextDueAt)}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); markTaskDone(task.id); }} className="text-xs text-[#635bff] hover:underline font-medium px-3 py-1 rounded-lg border border-[#635bff]/30 hover:bg-[#635bff]/5 transition-colors">\u2713 Done</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}'''

new_section = '''          {activeTab === 'schedules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#425466]">
                  {maintenanceTasks.filter(t => !doneTasks.has(t.id)).length} pending &middot;{' '}
                  <span className="text-emerald-600 font-medium">{doneTasks.size} completed</span>
                </p>
                <button onClick={() => setShowTaskModal(true)} className="bg-[#635bff] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#4f46e5] transition-colors">
                  + Add Task
                </button>
              </div>

              {/* Pending Tasks */}
              {maintenanceTasks.filter(t => !doneTasks.has(t.id)).length === 0 && doneTasks.size === 0 ? (
                <div className="bg-white rounded-xl border border-[#e6ebf1] p-12 text-center">
                  <svg className="w-12 h-12 text-[#c0ccda] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-[#8898aa] text-sm">No maintenance tasks due in the next 7 days.</p>
                </div>
              ) : maintenanceTasks.filter(t => !doneTasks.has(t.id)).length === 0 ? (
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-8 text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-emerald-700 font-semibold text-sm">All tasks completed!</p>
                  <p className="text-emerald-600 text-xs mt-1">Great work keeping up with maintenance.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#e6ebf1] divide-y divide-[#e6ebf1]">
                  {maintenanceTasks.filter(t => !doneTasks.has(t.id)).map((task) => (
                    <div key={task.id} className="px-5 py-4 flex items-center justify-between hover:bg-[#f6f9fc] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => markTaskDone(task.id)}
                          className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-[#e6ebf1] hover:border-emerald-400 hover:bg-emerald-50 transition-colors flex items-center justify-center group"
                          title="Mark as done"
                        >
                          <svg className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <div className="min-w-0">
                          <p className="font-medium text-[#0a2540] text-sm truncate">{task.title}</p>
                          <p className="text-xs text-[#8898aa] mt-0.5">{task.machine?.name ?? 'General'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`text-xs font-medium hidden sm:block ${task.nextDueAt && new Date(task.nextDueAt) < new Date() ? 'text-red-500 font-semibold' : 'text-[#0a2540]'}`}>
                          {formatDate(task.nextDueAt)}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); markTaskDone(task.id); }}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold px-3 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-colors"
                        >
                          \u2713 Done
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteTask(task.id); }}
                          className="text-xs text-red-400 hover:text-red-600 font-semibold px-2 py-1 rounded-lg border border-red-100 hover:bg-red-50 transition-colors"
                          title="Delete task"
                        >
                          \u2715
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Completed Tasks Section */}
              {doneTasks.size > 0 && (
                <div className="bg-white rounded-xl border border-emerald-100 overflow-hidden">
                  <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Completed This Session ({doneTasks.size})</span>
                  </div>
                  <div className="divide-y divide-[#e6ebf1]">
                    {maintenanceTasks.filter(t => doneTasks.has(t.id)).map((task) => (
                      <div key={task.id} className="px-5 py-3 flex items-center justify-between bg-emerald-50/30">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-[#425466] line-through truncate">{task.title}</p>
                            <p className="text-xs text-[#8898aa]">{task.machine?.name ?? 'General'} &middot; Marked done</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteTask(task.id); }}
                          disabled={deletingTaskId === task.id}
                          className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded border border-red-100 hover:bg-red-50 transition-colors ml-3 flex-shrink-0 disabled:opacity-50"
                        >
                          {deletingTaskId === task.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Confirm Delete Task Modal */}
          {confirmDeleteTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-center font-semibold text-[#0a2540] mb-2">Delete Task?</h3>
                <p className="text-center text-sm text-[#425466] mb-6">This will permanently remove the maintenance task. This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmDeleteTask(null)} className="flex-1 px-4 py-2 border border-[#e6ebf1] rounded-lg text-sm font-medium text-[#425466] hover:bg-[#f6f9fc]">Cancel</button>
                  <button onClick={() => deleteTask(confirmDeleteTask)} disabled={!!deletingTaskId} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
                    {deletingTaskId ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}'''

if old_section in content:
    content = content.replace(old_section, new_section, 1)
    print("Schedule tab replaced successfully")
else:
    print("NOT FOUND - checking partial match")
    idx = content.find("activeTab === 'schedules'")
    print(f"Found at index: {idx}")
    # show 50 chars before and after
    print(repr(content[idx-5:idx+60]))

with open('app/dashboard/DashboardClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")