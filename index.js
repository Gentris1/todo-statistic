const {getAllFilePathsWithExtension, readFile} = require('./fileSystem');
const {readLine} = require('./console');

const files = getFiles();

console.log('Please, write your command!');
readLine(processCommand);

function getFiles() {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    return filePaths.map(path => readFile(path));
}

function extractTodos(files) {
    const todos = [];
    files.forEach(file => {
        const lines = file.split('\n');
        lines.forEach(line => {
            if (line.trim().startsWith('// TODO ')) {
                todos.push(line.trim());
            }
        });
    });
    return todos;
}

function formatTodoTable(todos) {
    return todos.map(todo => {
        const parts = todo.split(';');
        const importance = todo.includes('!') ? '!' : ' ';
        const user = parts.length >= 3 ? parts[0].replace('// TODO ', '').trim() : ' ';
        const date = parts.length >= 3 ? parts[1].trim() : ' ';
        const comment = parts.length >= 3 ? parts[2].trim() : todo.replace('// TODO ', '').trim();

        return {
            importance: importance,
            user: user.length > 10 ? user.substring(0, 7) + '...' : user,
            date: date.length > 10 ? date.substring(0, 10) : date,
            comment: comment.length > 50 ? comment.substring(0, 47) + '...' : comment
        };
    });
}

function printTable(todos) {
    console.log('  !  |  user        |  date        |  comment');
    console.log('-'.repeat(77));
    todos.forEach(todo => {
        console.log(
            `  ${todo.importance}  |  ${todo.user.padEnd(10)}  |  ${todo.date.padEnd(10)}  |  ${todo.comment.padEnd(50)}`
        );
    });
}

function filterImportantTodos(todos) {
    return todos.filter(todo => todo.includes('!'));
}

function filterTodosByUser(todos, username) {
    return todos.filter(todo => {
        const parts = todo.split(';');
        if (parts.length >= 3) {
            const author = parts[0].replace('// TODO ', '').trim();
            return author.toLowerCase() === username.toLowerCase();
        }
        return false;
    });
}

function sortByImportance(todos) {
    return todos.sort((a, b) => {
        const aPriority = (a.split('!').length - 1);
        const bPriority = (b.split('!').length - 1);
        return bPriority - aPriority;
    });
}

function sortByUser(todos) {
    const grouped = {};
    todos.forEach(todo => {
        const parts = todo.split(';');
        const author = parts.length >= 3 ? parts[0].replace('// TODO ', '').trim() : 'unnamed';
        if (!grouped[author]) {
            grouped[author] = [];
        }
        grouped[author].push(todo);
    });

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (a === 'unnamed') return 1;
        if (b === 'unnamed') return -1;
        return a.localeCompare(b);
    });

    return sortedKeys.flatMap(key => grouped[key]);
}

function sortByDate(todos) {
    return todos.sort((a, b) => {
        const aParts = a.split(';');
        const bParts = b.split(';');

        const aDate = aParts.length >= 3 ? new Date(aParts[1].trim()) : null;
        const bDate = bParts.length >= 3 ? new Date(bParts[1].trim()) : null;

        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return bDate - aDate;
    });
}

function filterTodosAfterDate(todos, dateString) {
    const dateParts = dateString.split('-');
    let targetDate;

    if (dateParts.length === 1) {
        targetDate = new Date(dateParts[0], 0, 1);
    } else if (dateParts.length === 2) {
        targetDate = new Date(dateParts[0], dateParts[1] - 1, 1);
    } else if (dateParts.length === 3) {
        targetDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    } else {
        console.log('Invalid date format');
        return [];
    }

    return todos.filter(todo => {
        const parts = todo.split(';');
        if (parts.length >= 3) {
            const todoDate = new Date(parts[1].trim());
            return todoDate > targetDate;
        }
        return false;
    });
}

function processCommand(command) {
    const todos = extractTodos(files);

    switch (true) {
        case command === 'exit':
            process.exit(0);
            break;
        case command === 'show':
            printTable(formatTodoTable(todos));
            break;
        case command === 'important':
            const importantTodos = filterImportantTodos(todos);
            printTable(formatTodoTable(importantTodos));
            break;
        case command.startsWith('user '):
            const username = command.split(' ')[1];
            const userTodos = filterTodosByUser(todos, username);
            printTable(formatTodoTable(userTodos));
            break;
        case command.startsWith('sort '):
            const sortType = command.split(' ')[1];
            let sortedTodos;
            switch (sortType) {
                case 'importance':
                    sortedTodos = sortByImportance(todos);
                    break;
                case 'user':
                    sortedTodos = sortByUser(todos);
                    break;
                case 'date':
                    sortedTodos = sortByDate(todos);
                    break;
                default:
                    console.log('wrong sort type');
                    return;
            }
            printTable(formatTodoTable(sortedTodos));
            break;
        case command.startsWith('date '):
            const dateString = command.split(' ')[1];
            const filteredTodos = filterTodosAfterDate(todos, dateString);
            printTable(formatTodoTable(filteredTodos));
            break;
        default:
            console.log('wrong command');
            break;
    }
}