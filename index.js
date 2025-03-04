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

function processCommand(command) {
    const todos = extractTodos(files);

    switch (true) {
        case command === 'exit':
            process.exit(0);
            break;
        case command === 'show':
            todos.forEach(todo => console.log(todo));
            break;
        case command === 'important':
            const importantTodos = filterImportantTodos(todos);
            importantTodos.forEach(todo => console.log(todo));
            break;
        case command.startsWith('user '):
            const username = command.split(' ')[1];
            const userTodos = filterTodosByUser(todos, username);
            userTodos.forEach(todo => console.log(todo));
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
            sortedTodos.forEach(todo => console.log(todo));
            break;
        default:
            console.log('wrong command');
            break;
    }
}

// TODO you can do it!
