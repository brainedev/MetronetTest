// *************************************************************************
// Custom Card Sort
// W. Brian Williams
// July 26, 2019
//
// Instructions: 
// To run this on a Windows PC, open a command prompt, navigate 
// to the folder where these files are located, and type 
// "CScript.exe customCardSort.js randomCardList.JSON [ASC|DESC]" + <ENTER>
// 
// MetroNet Developer Test - Brian Williams (2018-07-26) - 8.1 Custom Sorting
// *************************************************************************


// Define global object containing the values of each card face, and suit
var objCardValues = { 'J': 11, 'Q': 12, 'K': 13, 'A': 14, 'Hearts': 1, 'Diamonds': 2, 'Clubs': 3, 'Spades': 4 };

// Function to retrieve the cached sort value for a card object, or set it if it hasn't been set yet
// The algoritm will set a tens (or hundred and tens) digit for the primary sort criteria, the card face value,
//   and a ones digit for the secondary sort criteria, the cards suit value. These will be calculated using the above 'objCardValues' obj
// This will allow us to sort all of the cards more efficiently with a single iteration of the insertion sort, rather than two iterations
function _getSortValue() {
    if (!this._SortValue) {
        var iSortValue = 0;

        // Add the numeric or face value, multiplied by 10
        var cardValue = this.value.toUpperCase();
        if (cardValue && cardValue.length)
            iSortValue += (this.Parent.CardValues.Exists(cardValue) ? this.Parent.CardValues(cardValue) : this.value) * 10;

        // add the suit value in the 1's position
        var cardSuit = this.suit;
        if (cardSuit && cardSuit.length)
            iSortValue += objCardValues[cardSuit];

        this._SortValue = iSortValue;
    }
    return this._SortValue;
}

// Function to retrieve the cached Title for a card object, or set it if it hasn't been set yet
function _getCardTitle() {
    if (!this._CardTitle) {
        var sCardTitle = this.value;
        if (sCardTitle && sCardTitle.length && isNaN(parseInt(this.value)))
            switch (sCardTitle.toUpperCase()) {
                case "J":
                    sCardTitle = "Jack";
                    break;
                case "Q":
                    sCardTitle = "Queen";
                    break;
                case "K":
                    sCardTitle = "King";
                    break;
                case "A":
                    sCardTitle = "Ace";
                    break;
            }
        if (sCardTitle.length)
            sCardTitle += " of " + this.suit;

        this._CardTitle = sCardTitle;
    }
    return this._CardTitle;
}

// Helper function to add addtional custom methods to each card object in our cards array
function _initiateCardsObject() {
    // We need a key-value pair to store the numerical values for each card face and suit, for use in the sorting algorithm
    this.CardValues = WScript.CreateObject("Scripting.Dictionary");
    this.CardValues.Add('J', 11);
    this.CardValues.Add('Q', 12);
    this.CardValues.Add('K', 13);
    this.CardValues.Add('A', 14);
    this.CardValues.Add('Hearts', 1);
    this.CardValues.Add('Diamonds', 2);
    this.CardValues.Add('Clubs', 3);
    this.CardValues.Add('Spades', 4);

    if (isObject(this.cards) && isArray(this.cards)) {
        var iCard, iCardArrLen = this.cards.length;
        for (iCard = 0; iCard < iCardArrLen; iCard++) {
            var objCard = this.cards[iCard];

            // Add a parent property so each card object can reference back to the container
            objCard.Parent = this;

            // Set the CardTitle method of the card object to our _getCardTitle
            objCard.CardTitle = _getCardTitle;

            // Set the SortValue method of the card object to our _calcSortValue function above
            objCard.SortValue = _getSortValue;
        }
    }
}

// Helper function to test if a variable is an object
function isObject(testObj) {
    return (typeof testObj === "object" || typeof testObj === 'function') && (testObj !== null);
}

// Helper function to test if a variable is an array object
function isArray(testObj) {
    return Object.prototype.toString.call(testObj) === '[object Array]';
}

// Function to retrieve a list of cards from a JSON file, provided at runtime via the first argument
// If there are no arguments or the file doesn't exist, the program ends with instructions to the user
function retrieveCardsObjFromFile() {
    var args = WScript.Arguments;
    var bSortDescending = false;
    var returnObj = null;

    if (!args.length || args.length > 2) {
        WScript.Echo("Usage: CScript.exe customCardSort.js <CARD LIST JSON FILE> [ASC|DESC]");
        WScript.Quit();
    } else {
        // first argument is the JSON file containing the cards object
        // test to see if it exists, and if not let the user know and exit
        var fso = WScript.CreateObject("Scripting.FileSystemObject");
        var sInFile = WScript.CreateObject("WScript.Shell").CurrentDirectory + "\\" + args(0);
        if (!fso.FileExists(sInFile)) {
            WScript.Echo("File \"" + sInFile + "\" does not exist. Please try again.");
            WScript.Echo("Usage: CScript.exe customCardSort.js <CARD LIST JSON FILE> [ASC|DESC]");
            WScript.Quit();
        }

        var ForReading = 1;
        var inFile = fso.OpenTextFile(sInFile, ForReading);
        var sJSON = inFile.ReadAll();
        inFile.Close();

        try {
            eval("returnObj = " + sJSON);
        } catch (e) {
            WScript.Echo("File \"" + sInFile + "\" does not contain a valid card list JSON object. Please try a different file.");
            WScript.Echo("Usage: CScript.exe customCardSort.js <CARD LIST JSON FILE> [ASC|DESC]");
            WScript.Quit();
        }

        if (args.length == 2) {
            // While we have the arguments object, go ahead and detect whether the user specified it should be descending order
            var sSortOrder = args(1).toUpperCase();
            if (sSortOrder == 'ASC' || sSortOrder == 'DESC') {
                bSortDescending = (sSortOrder == 'DESC');
            } else {
                WScript.Echo("Usage: CScript.exe customCardSort.js <CARD LIST JSON FILE> [ASC|DESC]");
                WScript.Quit();
            }
        }
    }

    if (isObject(returnObj)) {        
        // Set the object's Initiate method and SortDescending property
        returnObj.Initiate = _initiateCardsObject;
        returnObj.SortDescending = bSortDescending;
    }

    return returnObj;
}

// Function to return an array of sorted cards. Accepts the unsorted array of cards and a boolean variable on whether to sort desc (true) or asc (false) as parameters
function getSortedCards(arrUnsortedCards, bSortDesc) {
    var arrSortedCards = [];
    if (isObject(arrUnsortedCards) && isArray(arrUnsortedCards)) {
        // Copy unsorted array by value into a new array variable, which we will perform the sort on
        var arrSortedCards = arrUnsortedCards.slice();

        // Classic insertion sort
        var iCard, jCard, iCardArrLen = arrSortedCards.length;
        for (iCard = 1; iCard < iCardArrLen; iCard++) { //outer loop
            var objNextCard = arrSortedCards[iCard];

            for (jCard = iCard - 1; jCard >= 0; jCard--) { //inner loop
                if ((bSortDesc && arrSortedCards[jCard].SortValue() < objNextCard.SortValue()) //DESC order
                    || (!bSortDesc && arrSortedCards[jCard].SortValue() > objNextCard.SortValue())) { //ASC Order
                    // if arrSortedCards[jCard] is less than objNextCard for DESC or greater than it for ASC, increase the position of arrSortedCards[jCard]
                    arrSortedCards[jCard + 1] = arrSortedCards[jCard]; 
                } else
                    break; //
            }
            arrSortedCards[jCard + 1] = objNextCard; // insert the next value to the correct postion of the already sorted elements
        }
    }
    // Return the array
    return arrSortedCards;
}

// Function to print the card list to the screen, separated into columns by tabs and using a string variable to buffer maxCols cards at a time before printing line to screen
function PrintCardList(arrCards) {
    var chTab = "\t";
    var maxCols = 4;
    if (isObject(arrCards) && isArray(arrCards)) {
        var sCache = chTab;
        var iCard, iCardArrLen = arrCards.length;
        for (iCard = 0; iCard < iCardArrLen; iCard++) {
            var objCard = arrCards[iCard];
            var sCardTitle = objCard.CardTitle();
            if ((iCard + 1) % maxCols) {
                // Two tabs to separate the cards, unless the title length is over 15 chars in which case only one - to preserve columnar format
                sCache += sCardTitle + chTab + ((sCardTitle.length <= 15) ? chTab : '');
            } else {
                //Using modular arithmatic, if the numeric index of the card divides into the maxCols with zero remainder, then we are ready to print the line and flush the cache
                sCache += sCardTitle;
                WScript.Echo(sCache);
                sCache = chTab;
            }
        }
        if (sCache != chTab)
            WScript.Echo(sCache);    
    }
}

// Function for main body of the script
function main() {
    WScript.Echo("Brian's JavaScript Card Sorter 1.0")
    WScript.Echo("");

    var unsortedCardsObj = retrieveCardsObjFromFile();
    unsortedCardsObj.Initiate();

    WScript.Echo("Loaded Unsorted Cards:");
    PrintCardList(unsortedCardsObj.cards);

    WScript.Echo("");
    WScript.Echo("Sorted Cards:");
    
    PrintCardList(getSortedCards(unsortedCardsObj.cards, unsortedCardsObj.SortDescending));

    unsortedCardsObj = null;
}

// Execute the script
main();