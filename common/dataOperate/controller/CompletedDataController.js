import { _saveCompleted, _delCompleted, _queryCompletedData } from '@/common/dataOperate/service/CompletedDataService'

import TaskCompleted from '@/common/model/TaskCompleted'

let addOrUpdateCompleted = function (task) {
	let taskCompleted = {
		taskId: task.id,
		//wishId: task.wishId,
		happy_coin: task.happy_coin,
		completed_count: task.completed_count
	};
	let temp_completed = new TaskCompleted(taskCompleted);
	
	return _queryCompletedData().then((completedData) => {
		_saveCompleted.bind(completedData)(temp_completed);
		/*if (task.wishId !== 'happyCoinPool')
			return _saveTaskCompleted.bind(completedData)(temp_taskCompleted);
		else
			return _saveHappyCoinPool.bind(completedData)(temp_taskCompleted);*/
	});
}

let deleteCompleted = function (task) {
	return _queryCompletedData().then((completedData) => {
		return _delCompleted.bind(completedData)(task);
		/*if (task.wishId !== 'happyCoinPool')
			return _delTaskCompleted.bind(completedData)(task);
		else 
			return _delHappyCoinPool.bind(completedData)(task);*/
	});
}

let queryCompletedData = function () {
	return _queryCompletedData();
}

export { addOrUpdateCompleted, deleteCompleted, queryCompletedData };
