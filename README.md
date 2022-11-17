# Cluster Class Scheduler

This repo contains a little app for doing cluster class scheduling.

## Usage

Watch a video demo [here](https://youtu.be/r8avNMhHAAA) to see how to download, install, and use Cluster Class Scheduler.

1. Download your cluster class schedule from Google Docs as a Comma Separated Values (.csv) file.  
_(File > Download > Comma Separated Values (.csv))_
2. Download and install the latest `cluster-class-scheduler` release [here](https://github.com/criccomini/cluster-class-scheduler/releases).
3. Open the app by right-clicking the app icon and selecting `Open`.  
You will get a warning that the app is untrusted; click `Open` again.
4. Click `Open Google Doc CSV file` in the app. Select the `.csv` file you downloaded in (1).
5. Configure the class days and mininum/maximum students.
6. Click `Generate and Save Assignments` at the bottom of the app.

## Configuration

A class list is automatically generated from the contents of the `.csv` file. The user may adjust the default configurations after the file is loaded. There are three configuration options:

* **Days**: Which days the class will be held. `Day 1` represents the first cluster class day (usually the first Friday), `Day 2` the second, and so on.
* **Minimum Students**: The minimum number of students required for the class to be held.
* **Maximum Students**: The maximum number of students allowed to enroll in a class.

## File Format

The Google Doc must have the following headers, exactly as defined below:

1. Timestamp
2. Your First and Last Name
3. Your Grade/Teacher
4. If you know you will be absent on a Cluster Class day, please select the day(s) you will be absent
5. Class choice #1
6. Class choice #2
7. Class choice #3
8. Class choice #4
9. Class choice #5
10. Class choice #6
11. Class choice #7
12. Class choice #8
13. Class choice #9
14. Class choice #10
15. Class choice #11
16. Class choice #12

Here's a sample:

```
Timestamp,Your First and Last Name,Your Grade/Teacher,"If you know you will be absent on a Cluster Class day, please select the day(s) you will be absent",Class choice #1,Class choice #2,Class choice #3,Class choice #4,Class choice #5,Class choice #6,Class choice #7,Class choice #8,Class choice #9,Class choice #10,Class choice #11,Class choice #12
5/2/2022 8:38:31,<student name 1>,5th - <teacher 1>,,How to Weave A Yarn Mandala,Mindful Art,Origami Creations,Backpacking and Camping,Magic: the Gathering,Ribbon Leis,Mini Scrapbooking,"Power of Words: Poetry, Song, and Art",Lego Build,The Magic of Patterns,Board Games,"Wheels, Wheels, Wheels"
5/2/2022 8:38:42,<student name 2>,4th - <teacher 2>,"Day 1",Ultimate Kickball,Clay Owl,Lego Build,Board Games,Magic: the Gathering,Design Challenges,"Wheels, Wheels, Wheels",Introduction to Chess,Origami Creations,Ribbon Leis,How to Weave A Yarn Mandala,The Game Go
```

These .csv files normally come from a Google doc that's generated from a Google survey.

## The Algorithm

The assignment algorithm is very basic, and definitely will have issues in certain circumstances. Nevertheless, it works given the choice distribution we have. `assigner.js` contains the bulk of the logic. It does the following:

1. Assign the minimum number of students to each class using each student's preferred classes.
2. Assign remaining students to classes based on their prefered classes (up to max class size).
3. Assign remaining students based on whatever is available.

This works quite well since each student provides 12 choices and the preferences are quite diverse.

_NOTE: I tested a stochastic approach using an optimization function based on student preference. This worked, but was much slower. In this approach, I randomly asigned students to clases, then proposed swapping students randomly; the swap was allowed if the optimization score improved._

## Building

Run the following to build Mac, Windows, and Linux distributions.

```
$ npm dist
```

Output goes to the ./dist directory.

## Debugging

The `electron-logs` package is used to log algorithmic behavior. By default, it writes logs to the following locations:

* on Linux: ~/.config/cluster-class-scheduler/logs/{process type}.log
* on macOS: ~/Library/Logs/cluster-class-scheduler/{process type}.log
* on Windows: %USERPROFILE%\AppData\Roaming\cluster-class-scheduler\logs\{process type}.log
