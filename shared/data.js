// ============================================================
// DATA
// ============================================================
const BOOKS_DEFAULT = [
  {"title":"The Alchemist","author":"Paulo Coelho","year":"1988","category":"Literature","condition":"Excellent","status":"Available","cover":"https://covers.openlibrary.org/b/id/15121528-L.jpg","readLink":"https://archive.org/stream/TheAlchemistPauloCoelho/The%20Alchemist%20-%20Paulo%20Coelho_djvu.txt"},
  {"title":"Pride and Prejudice","author":"Jane Austen","year":"1813","category":"Classic","condition":"Fragile","status":"Available","cover":"https://archive.org/download/prideprejudice0000jane_u2q4/page/cover_w500_h500.jpg","readLink":"https://www.gutenberg.org/files/1342/1342-h/1342-h.htm"},
  {"title":"Moby Dick","author":"Herman Melville","year":"1851","category":"Classic","condition":"Needs Restoration","status":"Available","cover":"https://covers.openlibrary.org/b/id/12621992-L.jpg"},
  {"title":"The Great Gatsby","author":"F. Scott Fitzgerald","year":"1920","category":"Classic Fiction","condition":"Worn Edges","status":"Available","cover":"https://covers.openlibrary.org/b/id/15175523-L.jpg"},
  {"title":"The Picture of Dorian Gray","author":"Oscar Wilde","year":"1890","category":"Gothic Horror","condition":"Mint","status":"Available","cover":"https://covers.openlibrary.org/b/id/14314700-L.jpg"},
  {"title":"Sherlock Holmes","author":"Arthur Conan Doyle","year":"1887","category":"Mystery","condition":"Yellowed Pages","status":"Available","cover":"https://covers.openlibrary.org/b/id/8242351-L.jpg","readLink":"https://www.gutenberg.org/files/1661/1661-h/1661-h.htm"},
  {"title":"Frankenstein","author":"Mary Shelley","year":"1818","category":"Science Fiction","condition":"Loose Binding","status":"Borrowed","cover":"https://covers.openlibrary.org/b/id/12752093-L.jpg"},
  {"title":"1984","author":"George Orwell","year":"1949","category":"Dystopian","condition":"Good","status":"Available","cover":"https://covers.openlibrary.org/b/id/12739335-L.jpg"},
  {"title":"Dracula","author":"Bram Stoker","year":"1897","category":"Gothic Horror","condition":"Yellowed Pages","status":"Available","cover":"https://covers.openlibrary.org/b/id/12622155-L.jpg"},
  {"title":"The Hobbit","author":"J.R.R. Tolkien","year":"1937","category":"Fantasy","condition":"Excellent","status":"Available","cover":"https://covers.openlibrary.org/b/id/14627222-L.jpg"},
  {"title":"Little Women","author":"Louisa May Alcott","year":"1848","category":"Literature","condition":"Fragile","status":"Available","cover":"https://covers.openlibrary.org/b/id/10615618-L.jpg"},
  {"title":"Wuthering Heights","author":"Emily Brontë","year":"1847","category":"Classic","condition":"Mint","status":"Available","cover":"https://covers.openlibrary.org/b/id/8255334-L.jpg"},
  {"title":"The Catcher in the Rye","author":"J.D. Salinger","year":"1951","category":"Literature","condition":"Good","status":"Available","cover":"https://covers.openlibrary.org/b/id/15172466-L.jpg"},
  {"title":"Crime and Punishment","author":"Fyodor Dostoevsky","year":"1866","category":"Psychological Fiction","condition":"Needs Restoration","status":"Available","cover":"https://covers.openlibrary.org/b/id/12622046-L.jpg"},
  {"title":"Brave New World","author":"Aldous Huxley","year":"1932","category":"Dystopian","condition":"Yellowed Pages","status":"Borrowed","cover":"https://covers.openlibrary.org/b/id/14846947-L.jpg"},
  {"title":"Introduction to Information Technology","author":"Various Authors","year":"2020","category":"Industrial/Information Technology","condition":"Good","status":"Available","cover":"https://covers.openlibrary.org/b/id/15121528-L.jpg"},
  {"title":"Industrial Engineering Handbook","author":"Various Authors","year":"2018","category":"Industrial Engineering","condition":"Excellent","status":"Available","cover":"https://covers.openlibrary.org/b/id/15121528-L.jpg"},
  {"title":"Hospitality Management Principles","author":"Various Authors","year":"2019","category":"Hospitality Management","condition":"Good","status":"Available","cover":"https://covers.openlibrary.org/b/id/15121528-L.jpg"},
  {"title":"Fisheries Science","author":"Various Authors","year":"2021","category":"Fisheries","condition":"Excellent","status":"Available","cover":"https://covers.openlibrary.org/b/id/15121528-L.jpg"},
  {"title":"Modern Fiction Stories","author":"Various Authors","year":"2022","category":"Fiction","condition":"Good","status":"Available","cover":"https://covers.openlibrary.org/b/id/15121528-L.jpg"},
  {"title":"General Reference Encyclopedia","author":"Various Authors","year":"2020","category":"General reference","condition":"Excellent","status":"Available","cover":"https://covers.openlibrary.org/b/id/15121528-L.jpg"},
  {"title":"Oxford English Dictionary","author":"Oxford University Press","year":"2023","category":"Dictionaries","condition":"Mint","status":"Available","cover":"https://covers.openlibrary.org/b/id/15121528-L.jpg"},
  {"title":"Research Methods in Social Sciences","author":"Various Authors","year":"2017","category":"Research books","condition":"Good","status":"Available","cover":"https://covers.openlibrary.org/b/id/15121528-L.jpg"}
];

const HOURS_DATA = [
  {day:'Monday',open:'8:00 AM',close:'6:00 PM',closed:false},
  {day:'Tuesday',open:'8:00 AM',close:'6:00 PM',closed:false},
  {day:'Wednesday',open:'8:00 AM',close:'6:00 PM',closed:false},
  {day:'Thursday',open:'8:00 AM',close:'6:00 PM',closed:false},
  {day:'Friday',open:'8:00 AM',close:'6:00 PM',closed:false},
  {day:'Saturday',open:'8:00 AM',close:'12:00 PM',closed:false},
  {day:'Sunday',open:'',close:'',closed:true}
];

const LIBRARIANS_DEFAULT = [
  {name:'MELANY M. MANLANGIT',role:'Librarian',status:'available',schedule:'Mon–Fri  8:00 AM – 6:00 PM',initial:'MM'},
  {name:'ANNALIE T. SALAZAR',role:'Staff',status:'available',schedule:'Mon–Fri  8:00 AM – 6:00 PM',initial:'AT'},
  {name:'LEONADEL V. FERER',role:'Staff',status:'available',schedule:'Mon–Fri  8:00 AM – 6:00 PM',initial:'LV'},
  {name:'JANELLE R. PARAN',role:'Staff',status:'available',schedule:'Mon–Fri  8:00 AM – 6:00 PM',initial:'JR'},
  {name:'LEO A. DELA PENA',role:'Library Assistant',status:'available',schedule:'Mon–Fri  8:00 AM – 6:00 PM',initial:'LA'},
  {name:'ARIAL A. MAGNO',role:'Library Assistant',status:'available',schedule:'Mon–Fri  8:00 AM – 6:00 PM',initial:'AM'}
];

const USERS_DEFAULT = [
  {id:1, username:'admin', password:'admin123', name:'Administrator', role:'admin'}
];

const CHESS_SETS = [
  {id:1,name:'Chess Set A',icon:'♟️'},
  {id:2,name:'Chess Set B',icon:'♟️'},
  {id:3,name:'Chess Set C',icon:'♟️'},
  {id:4,name:'Chess Set D',icon:'♟️'}
];