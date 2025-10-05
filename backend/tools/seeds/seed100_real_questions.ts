import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Question } from '../../src/models/question.model';

// 100 curated questions with 5 choices each, subject and difficulty
const QUESTIONS: Array<any> = [
  { text: 'What does HTML stand for?', choices: ['HyperText Markup Language', 'Hyperlinks and Text Markup Language', 'Home Tool Markup Language', 'Hyper Trainer Markup Language', 'HyperText Markdown Language'], correctIndex: 0, subject: 'web', difficulty: 'easy' },
  { text: 'Which CSS property controls the size of the font?', choices: ['font-style', 'text-size', 'font-size', 'text-style', 'font-weight'], correctIndex: 2, subject: 'web', difficulty: 'easy' },
  { text: 'Which HTTP status code means OK (successful request)?', choices: ['200', '301', '400', '404', '500'], correctIndex: 0, subject: 'web', difficulty: 'easy' },
  { text: 'Which SQL statement is used to retrieve data from a database?', choices: ['GET', 'SELECT', 'FETCH', 'RETRIEVE', 'OPEN'], correctIndex: 1, subject: 'db', difficulty: 'easy' },
  { text: 'In JavaScript, which keyword declares a block-scoped variable?', choices: ['var', 'let', 'const', 'both let and const', 'function'], correctIndex: 3, subject: 'js', difficulty: 'easy' },
  { text: 'Which data structure uses FIFO ordering?', choices: ['Stack', 'Queue', 'Tree', 'Graph', 'HashMap'], correctIndex: 1, subject: 'cs', difficulty: 'easy' },
  { text: 'Which sorting algorithm has average time complexity O(n log n)?', choices: ['Bubble Sort', 'Insertion Sort', 'Quick Sort', 'Selection Sort', 'Counting Sort'], correctIndex: 2, subject: 'algorithms', difficulty: 'medium' },
  { text: 'Which HTTP method is typically used to create a new resource?', choices: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], correctIndex: 1, subject: 'web', difficulty: 'easy' },
  { text: 'What does SQL stand for?', choices: ['Structured Query Language', 'Strong Query Language', 'Structured Question Language', 'Simple Query Language', 'Sequential Query Language'], correctIndex: 0, subject: 'db', difficulty: 'easy' },
  { text: 'Which of these is a NoSQL document database?', choices: ['MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'OracleDB'], correctIndex: 2, subject: 'db', difficulty: 'easy' },
  { text: 'Which principle does RESTful API architecture follow?', choices: ['Stateful operations', 'Stateless interactions', 'Centralized state', 'Heavy coupling', 'Binary protocol only'], correctIndex: 1, subject: 'web', difficulty: 'medium' },
  { text: 'In Big-O notation, what is the complexity of binary search on a sorted array?', choices: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)', 'O(n^2)'], correctIndex: 1, subject: 'algorithms', difficulty: 'easy' },
  { text: 'Which HTTP status code means Resource Not Found?', choices: ['200', '301', '400', '404', '500'], correctIndex: 3, subject: 'web', difficulty: 'easy' },
  { text: 'Which language is primarily used for styling web pages?', choices: ['HTML', 'CSS', 'JavaScript', 'Python', 'C++'], correctIndex: 1, subject: 'web', difficulty: 'easy' },
  { text: 'Which JavaScript method is used to parse a JSON string?', choices: ['JSON.parse', 'JSON.stringify', 'parseJSON', 'eval', 'JSON.load'], correctIndex: 0, subject: 'js', difficulty: 'easy' },
  { text: 'What is a primary key in a relational database?', choices: ['A unique identifier for a row', 'A key that encrypts data', 'A foreign reference', 'A clustering index', 'A column with NULLs only'], correctIndex: 0, subject: 'db', difficulty: 'easy' },
  { text: 'What does CSS stand for?', choices: ['Cascading Style Sheets', 'Computer Style Sheets', 'Creative Style System', 'Coded Style Sheets', 'Component Style System'], correctIndex: 0, subject: 'web', difficulty: 'easy' },
  { text: 'Which of these is a functional programming language?', choices: ['Java', 'Haskell', 'C', 'HTML', 'CSS'], correctIndex: 1, subject: 'cs', difficulty: 'medium' },
  { text: 'Which command initializes a new Git repository?', choices: ['git start', 'git init', 'git create', 'git new', 'git repo'], correctIndex: 1, subject: 'tools', difficulty: 'easy' },
  { text: 'Which protocol is used to securely browse the web?', choices: ['HTTP', 'FTP', 'SSH', 'HTTPS', 'SMTP'], correctIndex: 3, subject: 'web', difficulty: 'easy' },
  { text: 'Which data type is immutable in Python?', choices: ['list', 'dict', 'set', 'tuple', 'bytearray'], correctIndex: 3, subject: 'python', difficulty: 'easy' },
  { text: 'What is the output of 2 + 3 * 4 in standard arithmetic precedence?', choices: ['20', '14', '24', '10', 'None of the above'], correctIndex: 1, subject: 'math', difficulty: 'easy' },
  { text: 'Which SQL clause is used to filter rows returned by a query?', choices: ['ORDER BY', 'GROUP BY', 'WHERE', 'HAVING', 'LIMIT'], correctIndex: 2, subject: 'db', difficulty: 'easy' },
  { text: 'Which JavaScript keyword creates a constant reference?', choices: ['let', 'var', 'const', 'constant', 'immutable'], correctIndex: 2, subject: 'js', difficulty: 'easy' },
  { text: 'Which data structure is best for implementing a LIFO stack?', choices: ['Queue', 'Array or Linked List', 'Binary Tree', 'Hash Table', 'Graph'], correctIndex: 1, subject: 'cs', difficulty: 'easy' },
  { text: 'Which sorting algorithm is stable?', choices: ['Quick Sort', 'Heap Sort', 'Merge Sort', 'Selection Sort', 'Shell Sort'], correctIndex: 2, subject: 'algorithms', difficulty: 'medium' },
  { text: 'In networking, what does DNS stand for?', choices: ['Domain Name System', 'Distributed Network Service', 'Domain Name Service', 'Direct Name System', 'Digital Name Service'], correctIndex: 0, subject: 'networking', difficulty: 'easy' },
  { text: 'Which HTTP header is used to specify allowed origins for CORS?', choices: ['Access-Control-Allow-Origin', 'Allow-Origin', 'CORS-Allow', 'Access-Allow-Origin', 'Origin-Allow'], correctIndex: 0, subject: 'web', difficulty: 'medium' },
  { text: 'Which of these is NOT a NoSQL database type?', choices: ['Document', 'Key-Value', 'Relational', 'Graph', 'Wide-column'], correctIndex: 2, subject: 'db', difficulty: 'medium' },
  { text: 'What is tail recursion?', choices: ['Recursion that uses constant space for each call', 'Recursion where the recursive call is the last operation', 'Recursion without base case', 'Recursion that always fails', 'Recursion converted to loops only'], correctIndex: 1, subject: 'algorithms', difficulty: 'hard' },
  { text: 'Which HTTP method should be idempotent?', choices: ['POST', 'PUT', 'CONNECT', 'TRACE', 'PATCH'], correctIndex: 1, subject: 'web', difficulty: 'medium' },
  { text: 'Which command installs packages in npm?', choices: ['npm start', 'npm install', 'npm run install', 'npm get', 'npm add'], correctIndex: 1, subject: 'tools', difficulty: 'easy' },
  { text: 'In Git, which command creates a new branch?', choices: ['git branch new', 'git checkout -b', 'git create branch', 'git new-branch', 'git switch -n'], correctIndex: 1, subject: 'tools', difficulty: 'easy' },
  { text: 'Which HTML element is used to include JavaScript?', choices: ['<js>', '<script>', '<javascript>', '<code>', '<include>'], correctIndex: 1, subject: 'web', difficulty: 'easy' },
  { text: 'Which of the following is a primary use for Redis?', choices: ['Long-term persistent storage', 'In-memory caching and pub/sub', 'Only file storage', 'Image processing', 'Email service'], correctIndex: 1, subject: 'db', difficulty: 'medium' },
  { text: 'Which complexity class represents problems solvable in polynomial time?', choices: ['P', 'NP', 'EXP', 'LOG', 'PSPACE'], correctIndex: 0, subject: 'cs', difficulty: 'hard' },
  { text: 'Which of these is a frontend framework?', choices: ['Django', 'Flask', 'React', 'Express', 'Spring'], correctIndex: 2, subject: 'web', difficulty: 'easy' },
  { text: 'What is a promise in JavaScript?', choices: ['A callback function', 'A way to schedule tasks', 'An object representing eventual completion or failure of an async operation', 'A synchronous iterator', 'A data structure for queues'], correctIndex: 2, subject: 'js', difficulty: 'medium' },
  { text: 'Which SQL keyword removes duplicate rows from a SELECT result?', choices: ['UNIQUE', 'DISTINCT', 'REMOVE_DUP', 'ONLY', 'FILTER'], correctIndex: 1, subject: 'db', difficulty: 'medium' },
  { text: 'Which design pattern ensures a class has only one instance?', choices: ['Factory', 'Singleton', 'Observer', 'Strategy', 'Decorator'], correctIndex: 1, subject: 'cs', difficulty: 'medium' },
  { text: 'Which of these is a characteristic of functional programming?', choices: ['Mutable state', 'First-class functions', 'Global side-effects', 'Imperative loops only', 'Goto statements'], correctIndex: 1, subject: 'cs', difficulty: 'medium' },
  { text: 'Which HTTP header carries the authentication token in many APIs?', choices: ['X-Auth-Token', 'Authorization', 'Auth-Token', 'X-Token', 'Cookie'], correctIndex: 1, subject: 'web', difficulty: 'medium' },
  { text: 'Which number base is hexadecimal?', choices: ['Base 2', 'Base 8', 'Base 10', 'Base 16', 'Base 32'], correctIndex: 3, subject: 'math', difficulty: 'easy' },
  { text: 'What does CI/CD stand for?', choices: ['Continuous Integration / Continuous Deployment', 'Code Integration / Code Delivery', 'Continuous Improvement / Continuous Delivery', 'Code Inspect / Code Deploy', 'Continuous Integration / Continuous Delivery'], correctIndex: 0, subject: 'tools', difficulty: 'medium' },
  { text: 'Which command shows the commit history in Git?', choices: ['git history', 'git log', 'git commits', 'git show-all', 'git status'], correctIndex: 1, subject: 'tools', difficulty: 'easy' },
  { text: 'Which structure stores key-value pairs with average O(1) access?', choices: ['Array', 'LinkedList', 'Hash Table', 'Binary Tree', 'Queue'], correctIndex: 2, subject: 'cs', difficulty: 'easy' },
  { text: 'Which SQL clause is used to group rows that share a property?', choices: ['GROUP BY', 'ORDER BY', 'WHERE', 'HAVING', 'LIMIT'], correctIndex: 0, subject: 'db', difficulty: 'easy' },
  { text: 'Which of the following is NOT a JavaScript primitive?', choices: ['string', 'number', 'boolean', 'object', 'symbol'], correctIndex: 3, subject: 'js', difficulty: 'easy' },
  { text: 'Which algorithm finds shortest paths in a weighted graph with non-negative edges?', choices: ['Kruskal', 'Prim', 'Dijkstra', 'Bellman-Ford', 'Floyd-Warshall'], correctIndex: 2, subject: 'algorithms', difficulty: 'medium' },
  { text: 'What does ACID refer to in databases?', choices: ['Atomicity, Consistency, Isolation, Durability', 'Accuracy, Consistency, Integrity, Durability', 'Atomicity, Consistency, Integrity, Durability', 'Availability, Consistency, Isolation, Durability', 'Atomicity, Concurrency, Isolation, Durability'], correctIndex: 0, subject: 'db', difficulty: 'hard' },
  { text: 'Which CSS layout model allows items to wrap and align in two dimensions?', choices: ['Flexbox', 'Grid', 'Block', 'Inline', 'Table'], correctIndex: 1, subject: 'web', difficulty: 'medium' },
  { text: 'Which of these is a bridge between front-end and back-end, enabling APIs?', choices: ['HTML', 'CSS', 'API Gateway', 'Webpack', 'Babel'], correctIndex: 2, subject: 'web', difficulty: 'medium' },
  { text: 'Which of the following describes a REST constraint?', choices: ['Client-server, stateless, cacheable, layered system, uniform interface', 'Stateful server, unified interface, single layer', 'Only cacheable interactions', 'Client-server and monolithic', 'None of the above'], correctIndex: 0, subject: 'web', difficulty: 'hard' },
  { text: 'Which structure can detect cycles in a directed graph using DFS?', choices: ['Topological sort', 'BFS', 'DFS with recursion stack', 'Dijkstra', 'Union-Find'], correctIndex: 2, subject: 'algorithms', difficulty: 'hard' },
  { text: 'What does OAuth primarily provide?', choices: ['Authentication', 'Authorization', 'Encryption', 'Data storage', 'Token persistence'], correctIndex: 1, subject: 'security', difficulty: 'medium' },
  { text: 'Which of these is used for containerization?', choices: ['VMware', 'Docker', 'VirtualBox', 'KVM', 'Hyper-V'], correctIndex: 1, subject: 'devops', difficulty: 'easy' },
  { text: 'Which loop guarantees at least one execution in many languages?', choices: ['for', 'while', 'do-while', 'foreach', 'map'], correctIndex: 2, subject: 'cs', difficulty: 'easy' },
  { text: 'Which HTTP status code indicates a redirect?', choices: ['2xx', '3xx', '4xx', '5xx', '1xx'], correctIndex: 1, subject: 'web', difficulty: 'easy' },
  { text: 'Which is a NoSQL key-value store?', choices: ['MongoDB', 'Redis', 'PostgreSQL', 'SQLite', 'MySQL'], correctIndex: 1, subject: 'db', difficulty: 'easy' },
  { text: 'Which mathematical structure represents relationships as nodes and edges?', choices: ['Array', 'Matrix', 'Graph', 'Tree', 'Set'], correctIndex: 2, subject: 'math', difficulty: 'easy' },
  { text: 'Which method converts a JS object to a JSON string?', choices: ['JSON.parse', 'JSON.stringify', 'toJSON', 'object.toString', 'serialize'], correctIndex: 1, subject: 'js', difficulty: 'easy' },
  { text: 'What is memoization used for?', choices: ['Speeding up IO operations', 'Caching function results to avoid recomputation', 'Sorting arrays', 'Encrypting data', 'Balancing trees'], correctIndex: 1, subject: 'algorithms', difficulty: 'medium' },
  { text: 'Which HTML attribute provides alternative text for images?', choices: ['title', 'alt', 'src', 'caption', 'desc'], correctIndex: 1, subject: 'web', difficulty: 'easy' },
  { text: 'Which SQL index type is best for range queries?', choices: ['Hash index', 'B-tree index', 'Bitmap index', 'Full-text index', 'Spatial index'], correctIndex: 1, subject: 'db', difficulty: 'medium' },
  { text: 'Which concept allows multiple versions of a dependency to coexist in Node.js projects?', choices: ['Static linking', 'Node modules nesting (node_modules)', 'Global install', 'Yarn exclusive', 'Monorepo only'], correctIndex: 1, subject: 'tools', difficulty: 'medium' },
  { text: 'Which of these is a reactive UI framework?', choices: ['React', 'Laravel', 'Symfony', 'Django', 'Flask'], correctIndex: 0, subject: 'web', difficulty: 'easy' },
  { text: 'Which function in many languages returns the number of elements in a collection?', choices: ['size()', 'length', 'count()', 'len()', 'All of the above depending on language'], correctIndex: 4, subject: 'cs', difficulty: 'easy' },
  { text: 'Which of these is an example of horizontal scaling?', choices: ['Adding more RAM to the server', 'Adding more CPU cores', 'Adding more machines behind a load balancer', 'Optimizing queries', 'Using SSD storage'], correctIndex: 2, subject: 'devops', difficulty: 'medium' },
  { text: 'Which HTTP header indicates the MIME type of the response?', choices: ['Content-Type', 'Accept', 'Content-Encoding', 'Content-Length', 'User-Agent'], correctIndex: 0, subject: 'web', difficulty: 'easy' },
  { text: 'Which of these is a cryptographic hash function?', choices: ['AES', 'SHA-256', 'RSA', 'TLS', 'HTTPS'], correctIndex: 1, subject: 'security', difficulty: 'medium' },
  { text: 'Which data structure uses nodes with pointers to children and possibly a parent?', choices: ['Array', 'LinkedList', 'Tree', 'Stack', 'Queue'], correctIndex: 2, subject: 'cs', difficulty: 'easy' },
  { text: 'What is a foreign key in relational databases?', choices: ['A unique identifier', 'A key used for encryption', 'A reference to a primary key in another table', 'A backup key', 'An index key'], correctIndex: 2, subject: 'db', difficulty: 'medium' },
  { text: 'Which process converts source code into executable code?', choices: ['Interpretation', 'Compilation', 'Transpilation', 'Packaging', 'Linking'], correctIndex: 1, subject: 'cs', difficulty: 'easy' },
  { text: 'Which of these is a load balancing algorithm?', choices: ['Round Robin', 'Binary Search', 'Depth First', 'Merge Sort', 'Quick Sort'], correctIndex: 0, subject: 'devops', difficulty: 'easy' },
  { text: 'Which of the following are HTTP verbs? (choose best single)', choices: ['GET', 'JSON', 'HTML', 'CSS', 'SQL'], correctIndex: 0, subject: 'web', difficulty: 'easy' },
  { text: 'Which JavaScript feature allows asynchronous code to be written in a synchronous style?', choices: ['Callbacks', 'Promises', 'Async/Await', 'Events', 'Generators'], correctIndex: 2, subject: 'js', difficulty: 'medium' },
  { text: 'Which of the following is a NoSQL wide-column store?', choices: ['Cassandra', 'MySQL', 'Postgres', 'SQLite', 'Oracle'], correctIndex: 0, subject: 'db', difficulty: 'medium' },
  { text: 'Which mathematical concept describes growth that doubles at a constant rate?', choices: ['Linear', 'Exponential', 'Logarithmic', 'Polynomial', 'Quadratic'], correctIndex: 1, subject: 'math', difficulty: 'easy' },
  { text: 'Which is true about HTTPS compared to HTTP?', choices: ['HTTPS is slower and less secure', 'HTTPS uses TLS/SSL to encrypt traffic', 'HTTPS uses a different port only', 'HTTPS is obsolete', 'HTTPS is only for APIs'], correctIndex: 1, subject: 'web', difficulty: 'easy' },
  { text: 'Which method removes the last element from an array in many languages?', choices: ['pop()', 'push()', 'shift()', 'unshift()', 'removeLast()'], correctIndex: 0, subject: 'cs', difficulty: 'easy' },
  { text: 'What is the purpose of a mutex?', choices: ['To speed up network IO', 'To prevent concurrent access to a resource', 'To encrypt data', 'To schedule tasks', 'To balance load'], correctIndex: 1, subject: 'cs', difficulty: 'medium' },
  { text: 'Which SQL statement modifies existing rows in a table?', choices: ['INSERT', 'UPDATE', 'DELETE', 'SELECT', 'ALTER'], correctIndex: 1, subject: 'db', difficulty: 'easy' },
  { text: 'Which of these is a unit testing framework for JavaScript?', choices: ['Mocha', 'Flask', 'Django', 'Spring', 'Rails'], correctIndex: 0, subject: 'tools', difficulty: 'easy' },
  { text: 'Which scheduling algorithm gives priority to shortest jobs first?', choices: ['Round Robin', 'Shortest Job First', 'First Come First Serve', 'Priority Scheduling', 'Multilevel Queue'], correctIndex: 1, subject: 'cs', difficulty: 'medium' },
  { text: 'Which technique avoids recomputing expensive function results?', choices: ['Memoization', 'Recursion', 'Iteration', 'Branching', 'Inlining'], correctIndex: 0, subject: 'algorithms', difficulty: 'medium' },
  { text: 'What is the main purpose of a CDN (Content Delivery Network)?', choices: ['Database replication', 'Faster content delivery via geographic caching', 'Encrypting data', 'CI/CD pipeline', 'Load testing'], correctIndex: 1, subject: 'devops', difficulty: 'medium' },
  { text: 'Which HTTP header can prevent clickjacking by restricting framing?', choices: ['X-Frame-Options', 'Content-Security-Policy', 'X-XSS-Protection', 'Strict-Transport-Security', 'Referrer-Policy'], correctIndex: 0, subject: 'security', difficulty: 'medium' },
  { text: 'Which of these is a graph traversal algorithm?', choices: ['Quick Sort', 'Breadth-First Search', 'Binary Search', 'Dijkstra', 'Merge Sort'], correctIndex: 1, subject: 'algorithms', difficulty: 'easy' },
  { text: 'What is eventual consistency?', choices: ['Immediate consistency across all nodes', 'A consistency model where updates propagate and become consistent over time', 'No consistency at all', 'Consistency for only master nodes', 'Strict transactional consistency'], correctIndex: 1, subject: 'db', difficulty: 'hard' },
  { text: 'Which port is the default for HTTPS?', choices: ['80', '443', '8080', '3000', '22'], correctIndex: 1, subject: 'networking', difficulty: 'easy' },
  { text: 'Which of these is used to run JavaScript on the server?', choices: ['Node.js', 'Django', 'Rails', 'Laravel', 'Flask'], correctIndex: 0, subject: 'js', difficulty: 'easy' },
  { text: 'Which design principle encourages small, focused functions?', choices: ['Single Responsibility Principle', 'Open/Closed Principle', 'Liskov Substitution', 'Dependency Inversion', 'Interface Segregation'], correctIndex: 0, subject: 'cs', difficulty: 'medium' },
  { text: 'Which statement about CAP theorem is correct?', choices: ['You can have Consistency, Availability, and Partition tolerance fully', 'CAP asserts you can only choose two of Consistency, Availability, Partition tolerance under network partition', 'CAP only applies to SQL databases', 'CAP is about caching', 'CAP is deprecated'], correctIndex: 1, subject: 'db', difficulty: 'hard' },
  { text: 'Which HTTP response header indicates caching policy?', choices: ['Cache-Control', 'Expires', 'ETag', 'Last-Modified', 'All of the above are related to caching'], correctIndex: 4, subject: 'web', difficulty: 'medium' },
  { text: 'Which type of testing focuses on interactions between components?', choices: ['Unit Testing', 'Integration Testing', 'E2E Testing', 'Smoke Testing', 'Load Testing'], correctIndex: 1, subject: 'testing', difficulty: 'medium' },
  { text: 'Which of these is an OAuth grant type?', choices: ['Authorization Code', 'Basic Auth', 'Digest Auth', 'SAML', 'Kerberos'], correctIndex: 0, subject: 'security', difficulty: 'medium' },
  { text: 'What is the purpose of TLS/SSL?', choices: ['Compress data', 'Encrypt and authenticate connections', 'Store data', 'Render web pages', 'Schedule tasks'], correctIndex: 1, subject: 'security', difficulty: 'medium' },
  { text: 'Which of the following is a binary tree traversal order?', choices: ['Inorder', 'Postorder', 'Preorder', 'All of the above', 'None of the above'], correctIndex: 3, subject: 'algorithms', difficulty: 'easy' },
  { text: 'Which storage type persists data across restarts?', choices: ['In-memory cache', 'Disk-based database', 'CPU registers', 'GPU memory', 'Ephemeral storage'], correctIndex: 1, subject: 'db', difficulty: 'easy' },
  { text: 'Which HTTP status code indicates a client error?', choices: ['2xx', '3xx', '4xx', '5xx', '1xx'], correctIndex: 2, subject: 'web', difficulty: 'easy' },
  { text: 'Which principle helps reduce coupling by depending on abstractions?', choices: ['Dependency Inversion Principle', 'Open/Closed Principle', 'Single Responsibility Principle', 'DRY', 'KISS'], correctIndex: 0, subject: 'cs', difficulty: 'medium' },
  { text: 'Which algorithm is used to detect cycles in an undirected graph?', choices: ['Union-Find (Disjoint Set Union)', 'Dijkstra', 'Kahn', 'Topological Sort', 'Bellman-Ford'], correctIndex: 0, subject: 'algorithms', difficulty: 'medium' },
  { text: 'Which of these is a common message queue?', choices: ['RabbitMQ', 'Postgres', 'MongoDB', 'Redis (not queues)', 'SQLite'], correctIndex: 0, subject: 'devops', difficulty: 'medium' },
  { text: 'Which HTTP header can be used to send JSON in a request?', choices: ['Content-Type: application/json', 'Accept: text/html', 'X-Requested-With: XMLHttpRequest', 'Content-Encoding: gzip', 'User-Agent: custom'], correctIndex: 0, subject: 'web', difficulty: 'easy' },
  { text: 'Which concept allows safe concurrent reading but exclusive writing?', choices: ['Mutex', 'Read-Write Lock', 'Semaphore', 'Spinlock', 'Barrier'], correctIndex: 1, subject: 'cs', difficulty: 'medium' },
  { text: 'Which SQL operation removes rows from a table?', choices: ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'UPDATE'], correctIndex: 1, subject: 'db', difficulty: 'easy' },
  { text: 'Which HTTP status indicates server error?', choices: ['2xx', '3xx', '4xx', '5xx', '1xx'], correctIndex: 3, subject: 'web', difficulty: 'easy' },
  { text: 'Which tool is commonly used for container orchestration?', choices: ['Docker Compose', 'Kubernetes', 'Vagrant', 'Ansible', 'Terraform'], correctIndex: 1, subject: 'devops', difficulty: 'medium' },
  { text: 'What is the principle of least privilege?', choices: ['Grant maximum permissions always', 'Grant users only the permissions they need', 'Deny all network traffic', 'Use root user for all tasks', 'Share credentials among team'], correctIndex: 1, subject: 'security', difficulty: 'easy' },
  { text: 'Which of these is an advantage of using indexes in databases?', choices: ['Faster writes always', 'Faster reads for indexed columns', 'Less storage used', 'No need for backups', 'Eliminates the need for joins'], correctIndex: 1, subject: 'db', difficulty: 'medium' },
  { text: 'Which of these is a binary search tree property?', choices: ['Left child value < parent < right child value', 'All nodes have two children', 'Tree is always balanced', 'No duplicate values allowed', 'Nodes are stored in linked list'], correctIndex: 0, subject: 'algorithms', difficulty: 'medium' },
  { text: 'Which concept describes separating concerns into layers (e.g., presentation, business, data)?', choices: ['Layered architecture', 'Monolithic design', 'Tightly coupled modules', 'Spaghetti code', 'Event-driven architecture'], correctIndex: 0, subject: 'cs', difficulty: 'medium' },
  { text: 'Which HTTP status code indicates resource created?', choices: ['200', '201', '202', '204', '301'], correctIndex: 1, subject: 'web', difficulty: 'easy' },
  { text: 'Which of the following is true about JWTs?', choices: ['They are encrypted by default', 'They contain claims and are signed', 'They cannot be verified', 'They are only for sessions', 'They must be stored in database'], correctIndex: 1, subject: 'security', difficulty: 'medium' },
  { text: 'Which sorting algorithm is in-place and has average O(n log n) but worst-case O(n^2)?', choices: ['Merge Sort', 'Quick Sort', 'Heap Sort', 'Bubble Sort', 'Insertion Sort'], correctIndex: 1, subject: 'algorithms', difficulty: 'medium' },
  { text: 'Which of these is NOT a programming paradigm?', choices: ['Functional', 'Object-Oriented', 'Procedural', 'Declarative', 'Hierarchical'], correctIndex: 4, subject: 'cs', difficulty: 'easy' },
  { text: 'Which process ensures software changes do not break existing behavior?', choices: ['Load testing', 'Integration', 'Regression testing', 'Alpha testing', 'Ad-hoc testing'], correctIndex: 2, subject: 'testing', difficulty: 'medium' },
  { text: 'Which of these HTTP headers is used for caching validation?', choices: ['If-Modified-Since', 'Authorization', 'Cookie', 'User-Agent', 'Host'], correctIndex: 0, subject: 'web', difficulty: 'medium' },
  { text: 'Which tool helps automate infrastructure provisioning as code?', choices: ['Webpack', 'Terraform', 'Jest', 'Mocha', 'Babel'], correctIndex: 1, subject: 'devops', difficulty: 'medium' },
  { text: 'Which of these is a symmetric encryption algorithm?', choices: ['RSA', 'AES', 'ECDSA', 'DSA', 'SHA-256'], correctIndex: 1, subject: 'security', difficulty: 'medium' },
  { text: 'Which of the following is true for TCP?', choices: ['Connectionless protocol', 'Guaranteed delivery via handshakes and ACKs', 'Used for DNS queries by default', 'Stateless', 'None of the above'], correctIndex: 1, subject: 'networking', difficulty: 'medium' },
  { text: 'Which scheduling policy can improve responsiveness for short tasks?', choices: ['First Come First Serve', 'Shortest Job First', 'Round Robin', 'Priority', 'Multilevel Queue'], correctIndex: 2, subject: 'cs', difficulty: 'medium' },
  { text: 'Which of these is a good use for a CDN?', choices: ['Database replication', 'Static asset delivery near users', 'Encrypting data at rest', 'Running serverless functions', 'Testing backend APIs'], correctIndex: 1, subject: 'devops', difficulty: 'easy' },
  { text: 'Which of the following demonstrates polymorphism?', choices: ['Function overloading and overriding', 'Using global variables', 'Single responsibility', 'Dependency injection', 'Encapsulation'], correctIndex: 0, subject: 'cs', difficulty: 'medium' },
  { text: 'Which is the best index type for full-text search in many databases?', choices: ['B-tree', 'Hash', 'Full-text index', 'Spatial index', 'Bitmap index'], correctIndex: 2, subject: 'db', difficulty: 'medium' },
  { text: 'Which of these is true about asynchronous I/O?', choices: ['It blocks the main thread', 'It allows non-blocking operations and callbacks/promises', 'It is synchronous by definition', 'It cannot be used in web servers', 'It is slower than synchronous I/O always'], correctIndex: 1, subject: 'cs', difficulty: 'medium' },
  { text: 'Which concept helps isolate changes by using interfaces or abstract classes?', choices: ['Abstraction', 'Inheritance', 'Polymorphism', 'Coupling', 'Cohesion'], correctIndex: 0, subject: 'cs', difficulty: 'medium' },
  { text: 'Which HTTP method is safe and should not modify server state?', choices: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], correctIndex: 0, subject: 'web', difficulty: 'easy' },
  { text: 'Which database operation is typically wrapped in transactions for consistency?', choices: ['SELECT', 'INSERT/UPDATE/DELETE sequences', 'READ ONLY queries', 'Index lookups', 'Schema introspection'], correctIndex: 1, subject: 'db', difficulty: 'medium' },
  { text: 'Which of these is an advantage of stateless services?', choices: ['Easier horizontal scaling', 'Stateful session convenience', 'Slower response times', 'More complex load balancing', 'Harder to cache'], correctIndex: 0, subject: 'web', difficulty: 'medium' },
  { text: 'Which checksum algorithm is commonly used to validate integrity but is not cryptographically secure?', choices: ['MD5', 'SHA-256', 'RSA', 'AES', 'HMAC'], correctIndex: 0, subject: 'security', difficulty: 'easy' },
  { text: 'Which of the following is true about garbage collection?', choices: ['Developers manually manage memory always', 'Runtime automatically frees unused memory in many languages', 'Garbage collection is only in C', 'It encrypts memory', 'It improves performance always'], correctIndex: 1, subject: 'cs', difficulty: 'medium' },
  { text: 'Which of these is an example of eventual consistency system?', choices: ['Traditional single-node RDBMS', 'Distributed NoSQL systems like Dynamo', 'Local file systems', 'In-memory caches without replication', 'Monolithic apps'], correctIndex: 1, subject: 'db', difficulty: 'hard' },
  { text: 'Which test type validates the complete system from the user perspective?', choices: ['Unit tests', 'Integration tests', 'End-to-end (E2E) tests', 'Static analysis', 'Smoke tests'], correctIndex: 2, subject: 'testing', difficulty: 'medium' },
  { text: 'Which is a major benefit of using HTTPS?', choices: ['Faster load times always', 'Encryption and server identity verification via certificates', 'No need for DNS', 'No need for ports', 'Eliminates all security issues'], correctIndex: 1, subject: 'security', difficulty: 'easy' },
  { text: 'Which storage engine in MySQL is often used for transactions?', choices: ['MyISAM', 'InnoDB', 'Memory', 'CSV', 'Archive'], correctIndex: 1, subject: 'db', difficulty: 'medium' },
  { text: 'Which of these best describes load testing?', choices: ['Testing with a single user', 'Testing with expected high load to measure performance', 'Testing only functionality', 'Manual testing by a developer', 'Unit testing'], correctIndex: 1, subject: 'testing', difficulty: 'medium' },
  { text: 'Which of these is an example of client-side storage in browsers?', choices: ['LocalStorage', 'Postgres', 'MongoDB', 'Redis', 'MySQL'], correctIndex: 0, subject: 'web', difficulty: 'easy' },
  { text: 'Which technique improves database read scalability?', choices: ['Vertical scaling only', 'Read replicas', 'Dropping indexes', 'Single master only', 'Using only in-memory DBs'], correctIndex: 1, subject: 'db', difficulty: 'medium' },
  { text: 'Which concept refers to breaking an application into smaller independent services?', choices: ['Monolith', 'Microservices', 'Singleton', 'MVC', 'Procedural'], correctIndex: 1, subject: 'architecture', difficulty: 'medium' },
  { text: 'Which of these is used for monitoring systems and collecting metrics?', choices: ['Prometheus', 'Webpack', 'Babel', 'Jest', 'ESLint'], correctIndex: 0, subject: 'devops', difficulty: 'medium' },
  { text: 'Which algorithm finds minimum spanning tree in a graph?', choices: ['Dijkstra', 'Kruskal', 'Bellman-Ford', 'DFS', 'BFS'], correctIndex: 1, subject: 'algorithms', difficulty: 'medium' },
  { text: 'Which of these is a common way to protect against SQL injection?', choices: ['String concatenation', 'Parameterized queries / prepared statements', 'Allowing user input directly', 'Using eval', 'Dynamic SQL only'], correctIndex: 1, subject: 'security', difficulty: 'medium' },
  { text: 'Which of the following best describes a race condition?', choices: ['Two processes producing same output', 'Unexpected behavior due to timing of concurrent accesses', 'A type of network attack', 'A memory leak', 'An intentional lock'], correctIndex: 1, subject: 'cs', difficulty: 'hard' },
  { text: 'Which storage format is human-readable and commonly used for config and APIs?', choices: ['Binary', 'JSON', 'Encrypted', 'Protocol Buffers (binary)', 'Compiled'], correctIndex: 1, subject: 'web', difficulty: 'easy' }
];

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/codingwars';
  console.log('Connecting to', uri);
  await mongoose.connect(uri, {} as any);

  let added = 0;
  for (const q of QUESTIONS) {
    try {
      const exists = await Question.findOne({ text: q.text }).lean();
      if (exists) {
        console.log('Skipping existing:', q.text.slice(0, 60));
        continue;
      }
      const created = await Question.create(q as any);
      console.log('Created', created._id.toString());
      added++;
    } catch (err: any) {
      console.warn('Error inserting', q.text.slice(0, 60), err && err.message ? err.message : err);
    }
  }

  await mongoose.disconnect();
  console.log('Done. Questions added:', added);
}

main().catch((err) => { console.error(err); process.exit(1); });