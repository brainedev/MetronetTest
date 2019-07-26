using System;
using System.Text.RegularExpressions;

// *************************************************************************
// Regular Expressions
// W. Brian Williams
// July 26, 2019
//
// Instructions: 
// To run this on a Windows PC, open a command prompt, navigate 
// to the bin folder where the executable file is located, and type 
// "BregEx.exe" + <ENTER>
// 
// MetroNet Developer Test - Brian Williams (2018-07-26) - 8.3 Regular Expressions
// *************************************************************************

namespace BregEx
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Brian's RegEx Date/Time Parser");

            bool bQuit = false;
            while (!bQuit)
            {
                Console.WriteLine("Please enter a timestamp of format yyyy-mm-dd[Thh:mm:ssZ] or 'Quit' to exit");
                string testString = Console.ReadLine();
                if (testString.ToLower() == "quit")
                    Environment.Exit(0);
                else
                    GetMatches(testString);
            }            
        }

        static bool GetMatches(string sTimeStamp) {
            bool bReturn = false;
            Int32 NumericTester = 0;

            //Print a blank line between for readability
            Console.WriteLine("");

            // Define a regular expression for timestamps.
           Regex rx = new Regex(@"(?<Year>\d{4})[\/-](?<Month>\d{2})[\/-](?<Day>\d{2})(T(?<Hours>\d{2})[\:](?<Minutes>\d{2})[\:](?<Seconds>\d{2})Z){0,1}",
              RegexOptions.Compiled | RegexOptions.IgnoreCase);

            // Find matches.
            MatchCollection matches = rx.Matches(sTimeStamp);

            bReturn = (matches.Count >= 1);

            // Report the number of matches found.
            Console.WriteLine("{0} set of matches found in: {1}", matches.Count, sTimeStamp);

            // Report on each match.
            foreach (Match match in matches)
            {
                GroupCollection reMatchGroups = match.Groups;
                foreach (Group reMatchGroup in reMatchGroups)
                {
                    if (!Int32.TryParse(reMatchGroup.Name, out NumericTester))
                        Console.WriteLine("'{0}': {1}", reMatchGroup.Name, reMatchGroup.Value);
                }
            }

            //Print a blank line between for readability
            Console.WriteLine("");

            return bReturn;
        }
    }
}
