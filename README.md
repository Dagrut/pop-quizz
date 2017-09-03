#pop-quizz

`pop-quizz` is a simple set of scripts that allows a teacher to broadcast a quizz to his students.

##Prerequisites

You should have `make` and `nodejs` installed on your GNU/Linux system (maybe Unix too?).

##Installation

To prepare dependancies, run :

```sh
npm install
make
```

##Running

To run the demo, try :

```sh
make demo
```

To run it with custom options, you may try something like :

```
node pop-quizz.js -q ./some/quizz/file.js -s ./a/students/list -d ./output/data/dir
```

##Options

Here are the available options of `pop-quizz` :

- `-q` *MANDATORY* Specify the quizz file.
- `-s` *MANDATORY* Specify the students list file.
- `-d` *MANDATORY* Specify the data directory output (will contain saved state, logs, and also a summary file).
- `-p` *OPTIONNAL* Specify the http listen port. Defaults to 8080.
- `-r` *OPTIONNAL* Run the quizz instantly, don't wait. You will not need to type `run` after starting. Mainly for testing.

##Commands

`pop-quizz` contains a small command interpreter. here are the available commands inside it :

- `?` `h` `help` (0 arguments) Shows the list of all commands.
- `go` `r` `run` `start` (0 arguments) Start the quizz. On startup, it is not started by default, so that the teacher can wait for everyone to be ready.
- `solution` `solve` `correct` (0 arguments) Solve the quizz, show it to each student and their associated good/bad responses.
- `state` `sumup` `recap` `summary` (0 arguments) Show a summary of how many students are still waiting, started, and ended the quizz. 
- `search` `find` `grep` `list` `l` (1 argument, optionnal) Search a student by name or ID. Searching for `*` shows everyone. When not given, it defaults to `*`. It will also show the current mark, remaining time, and IP address.
- `disconnect` `kill` `reset` (1 argument) Delete a student data (if he clicked on an other name for example). He will have to refresh his page to see the changes, however.
- `timeadd` `addtime` (2 arguments) Add time for a student. The first parameter is the name or ID of the student (like `search`) and the second is the number of minutes to add. Negative numbers are allowed here.
- `q` `close` `quit` `exit` (0 arguments) Quit the quizz, stop the server and shutdown.

##Files syntax

The students list should be a plaint text file with a name per line. No comments or else are allowed, so you may use any characters. Empty lines will be removed and the names will be sorted alphabetically.

The quizz file is a javascript file containing questions, answers, and also some details about the rendering of the whole quizz. Each question and response will get through a markdown renderer, so you can use the markdown syntax here.

You should look at the files inside the `demo` directory to see some examples of files.

##Notes about the behavior of pop-quizz

When you select a student name, the IP address is linked to this student, so when reloading the page, it will directly show the quizz, and not the students list anymore. Also if this student finished the quizz, it will show its mark.

When a student is connected on an account, no one else can use this account until he disconnects.

While the quizz is running, the form is serialized and saved frequently, so a student won't lose its data if he run out of battery for example.

Every important action is logged, so you may know who is doing what (like when someone switch to an other tab or window) and take action if required.

The marks are also written in the log files, side by side with the remaining time for the quizz, when they submitted it. Also if a student reach the time limit, the quizz will be automatically submitted for him.

For the question notation mode, see the `notationMode` variable within the `quizz1.js` example file.

When you quit the program, it will do two things (that are also done periodically each 10 seconds) : It will save the current state (each student state, mark, start time, and so on), and also write a **summary.txt** file containing these details in a human readable format. You can check this file whenever you want.
Note that the content of this file may NOT be the same as the `list` command output, since this command only list the current students state, not the previous ones (that were restored from a past session).

When you restart the program with the same data directory, it will load the previous state and be able to restore the state, marks and other details of each students.

##TODO

- [ ] Add a translation system, to show all strings displayed to the users, and also translate the output of the shell (For now I could not find something flexible enough to be used on server and browser side easily).
- [ ] Add an administration interface, for lazy people.
- [ ] Add more possible customizations
- [ ] Add a way to use other templates, styles, ... without having to change the `templates` directory.
- [x] Maybe split server code into multiple files.
