// *************************************************************************
// Data Validation
// W. Brian Williams
// July 26, 2019
//
// Instructions: 
// To run this on a Windows PC, open a command prompt, navigate 
// to the folder where these files are located, and type 
// "CScript.exe dataValidation.js contacts.JSON + <ENTER>
// 
// MetroNet Developer Test - Brian Williams (2018-07-26) - 8.2 Data Validation
// *************************************************************************

// Function to retrieve the cached Validation info for a Contact object, or set it if it hasn't been set yet
var reEmail = /^[^@]+@[^@]+$/gi;
var rePhone = /^[\d\- ]+$/g;
function _getValidityInfo() {
    if (!this._ValidityInfo) {
        var bValidEmail = reEmail.test(this.emailAddress);
        var bValidPhone = rePhone.test(this.phoneNumber);

        var iErrCount = 0;
        if (bValidEmail && bValidPhone) {
            this._ValidityInfo = "Valid";
        } else if (bValidEmail && !bValidPhone) {
            this._ValidityInfo = "Phone is invalid.";
            iErrCount++;
        } else if (!bValidEmail && bValidPhone) {
            this._ValidityInfo = "Email is invalid.";
            iErrCount++;
        } else {
            this._ValidityInfo = "Email and Phone are invalid.";
            iErrCount += 2;
        }

        if (iErrCount) {
            if (this.Parent.CityErrors.Exists(this.cityName))
                this.Parent.CityErrors(this.cityName) += iErrCount;
            else
                this.Parent.CityErrors.Add(this.cityName, iErrCount);
        }
    }
    return this._ValidityInfo;
}

// Helper function to add addtional custom methods to each Contact object in our Contacts array
function _initiateContactsObject() {
    // We need a key-value pair to store the numerical values for each Contact face and suit, for use in the sorting algorithm
    this.CityErrors = WScript.CreateObject("Scripting.Dictionary");

    if (isObject(this) && isArray(this)) {
        var iContact, iContactArrLen = this.length;
        for (iContact = 0; iContact < iContactArrLen; iContact++) {
            var objContact = this[iContact];

            // Add a parent property so each Contact object can reference back to the container
            objContact.Parent = this;

            // Set the ContactTitle method of the Contact object to our _getValidityInfo
            objContact.ValidityInfo = _getValidityInfo;
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

// Function to retrieve a list of Contacts from a JSON file, provided at runtime via the first argument
// If there are no arguments or the file doesn't exist, the program ends with instructions to the user
function retrieveContactsObjFromFile() {
    var args = WScript.Arguments;
    var returnObj = null;

    if (!args.length || args.length > 1) {
        WScript.Echo("Usage: CScript.exe dataValidation.js <Contact LIST JSON FILE>");
        WScript.Quit();
    } else {
        // first argument is the JSON file containing the Contacts object
        // test to see if it exists, and if not let the user know and exit
        var fso = WScript.CreateObject("Scripting.FileSystemObject");
        var sInFile = WScript.CreateObject("WScript.Shell").CurrentDirectory + "\\" + args(0);
        if (!fso.FileExists(sInFile)) {
            WScript.Echo("File \"" + sInFile + "\" does not exist. Please try again.");
            WScript.Echo("Usage: CScript.exe dataValidation.js <Contact LIST JSON FILE>");
            WScript.Quit();
        }

        var ForReading = 1;
        var inFile = fso.OpenTextFile(sInFile, ForReading);
        var sJSON = inFile.ReadAll();
        inFile.Close();

        try {
            eval("returnObj = " + sJSON);
        } catch (e) {
            WScript.Echo("File \"" + sInFile + "\" does not contain a valid Contact list JSON object. Please try a different file.");
            WScript.Echo("Usage: CScript.exe dataValidation.js <Contact LIST JSON FILE>");
            WScript.Quit();
        }        
    }

    if (isObject(returnObj)) {        
        // Set the object's Initiate method and SortDescending property
        returnObj.Initiate = _initiateContactsObject;
    }

    return returnObj;
}

// Function to return an array of sorted Contacts. Accepts the unsorted array of Contacts and a boolean variable on whether to sort desc (true) or asc (false) as parameters
function getSortedContacts(arrUnsortedContacts) {
    var arrSortedContacts = [];
    if (isObject(arrUnsortedContacts) && isArray(arrUnsortedContacts)) {
        // Copy unsorted array by value into a new array variable, which we will perform the sort on
        var arrSortedContacts = arrUnsortedContacts.slice();

        // Classic insertion sort
        var iContact, jContact, iContactArrLen = arrSortedContacts.length;
        for (iContact = 1; iContact < iContactArrLen; iContact++) { //outer loop
            var objNextContact = arrSortedContacts[iContact];

            for (jContact = iContact - 1; jContact >= 0; jContact--) { //inner loop
                if (arrSortedContacts[jContact].fullName > objNextContact.fullName) { //Alphabetical ascending order by FullName
                    arrSortedContacts[jContact + 1] = arrSortedContacts[jContact]; 
                } else
                    break; //
            }
            arrSortedContacts[jContact + 1] = objNextContact; // insert the next value to the correct postion of the already sorted elements
        }
    }
    // Return the array
    return arrSortedContacts;
}

function getSortedCollection(objCollection) {
    var arrName = objCollection.Keys().toArray().slice(), arrValue = objCollection.Items().toArray().slice();

    // Classic insertion sort
    var iCity, jCity, iCityArrLen = arrName.length;
    for (iCity = 1; iCity < iCityArrLen; iCity++) { //outer loop
        var nextName = arrName[iCity];
        var nextValue = arrValue[iCity];

        for (jCity = iCity - 1; jCity >= 0; jCity--) { //inner loop
            if (arrValue[jCity] < nextValue) { //Alphabetical descending order by value
                arrName[jCity + 1] = arrName[jCity];
                arrValue[jCity + 1] = arrValue[jCity];
            } else
                break; //
        }
        // insert the next value to the correct postion of the already sorted elements
        arrName[jCity + 1] = nextName;
        arrValue[jCity + 1] = nextValue;
    }

    var sortedCollection = WScript.CreateObject("Scripting.Dictionary");
    for (iCity = 0; iCity < iCityArrLen; iCity++)
        sortedCollection.Add(arrName[iCity], arrValue[iCity]);

    return sortedCollection;
}

// Function to print the Contact list to the screen, separated into columns by tabs and using a string variable to buffer maxCols Contacts at a time before printing line to screen
function PrintContactList(arrContacts) {
    var chTab = "\t";
    var maxCols = 2;
    if (isObject(arrContacts) && isArray(arrContacts)) {
        var sCache = chTab;
        var iContact, iContactArrLen = arrContacts.length;
        for (iContact = 0; iContact < iContactArrLen; iContact++) {
            var objContact = arrContacts[iContact];
            var sContactTitle = objContact.fullName + chTab + ((objContact.fullName.length <= 15) ? chTab : '') + ((objContact.fullName.length < 8) ? chTab : '');
            var sValidation = objContact.ValidityInfo();
            sValidation = sValidation + chTab + ((sValidation.length < 23) ? chTab : '') + ((sValidation.length <= 15) ? chTab : '') + ((sValidation.length < 8) ? chTab : '');
            if ((iContact + 1) % maxCols) {
                // Two tabs to separate the Contacts, unless the title length is over 15 chars in which case only one - to preserve columnar format
                sCache += sContactTitle + sValidation;
            } else {
                //Using modular arithmatic, if the numeric index of the Contact divides into the maxCols with zero remainder, then we are ready to print the line and flush the cache
                sCache += sContactTitle + sValidation;;
                WScript.Echo(sCache);
                sCache = chTab;
            }
        }
        if (sCache != chTab)
            WScript.Echo(sCache);    
    }
}

function PrintCityErrorCollection(colCityErrors) {
    var chTab = "\t";
    var maxCols = 3;
    var sCache = chTab;
    var iCity;
    var arrName = colCityErrors.Keys().toArray(), arrValue = colCityErrors.Items().toArray();
    for (iCity = 0; iCity < arrName.length; iCity++) {
        var ceName = arrName[iCity];
        var ceError = arrValue[iCity];
        var sCityReport = ceName + chTab + ((ceName.length < 8) ? chTab : '') + ceError.toString() + chTab;
        if ((iCity + 1) % maxCols) {
            // Two tabs to separate the Citys, unless the title length is over 15 chars in which case only one - to preserve columnar format
            sCache += sCityReport;
        } else {
            //Using modular arithmatic, if the numeric index of the City divides into the maxCols with zero remainder, then we are ready to print the line and flush the cache
            sCache += sCityReport;
            WScript.Echo(sCache);
            sCache = chTab;
        }        
    }
    if (sCache != chTab)
        WScript.Echo(sCache); 
}

// Function for main body of the script
function main() {
    WScript.Echo("Brian's JavaScript Contact Sorter 1.0")
    WScript.Echo("");

    var unsortedContactsObj = retrieveContactsObjFromFile();
    unsortedContactsObj.Initiate();

    WScript.Echo("Loaded Unsorted Contacts:");
    PrintContactList(unsortedContactsObj);

    WScript.Echo("");
    WScript.Echo("Sorted Contacts:");
    PrintContactList(getSortedContacts(unsortedContactsObj));

    WScript.Echo("");
    WScript.Echo("Unsorted Validation Errors, by City:");
    PrintCityErrorCollection(unsortedContactsObj.CityErrors);

    WScript.Echo("");
    WScript.Echo("Sorted Validation Errors, by City:");
    PrintCityErrorCollection(getSortedCollection(unsortedContactsObj.CityErrors));

    unsortedContactsObj = null;
}

// Execute the script
main();