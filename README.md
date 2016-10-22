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
node pop-quizz.js -q ./some/quizz/file.js -s ./a/students/list -l ./output/logs/dir
```

##Options

Here are the available options of `pop-quizz` :

- `-q` *MANDATORY* Specify the quizz file.
- `-s` *MANDATORY* Specify the studends list file.
- `-l` *MANDATORY* Specify the log directory output.
- `-p` *OPTIONNAL* Specify the http listen port. Defaults to 8080.
- `-r` *OPTIONNAL* Run the quizz instantly, don't wait. You will not need to type `run` after starting.

##Commands

`pop-quizz` contains a small command interpreter. here are the available commands inside it :

- `?` `h` `help` (0 arguments) Shows the list of all commands.
- `go` `r` `run` `start` (0 arguments) Start the quizz. On startup, it is not started by default, so that the teacher can wait for everyone to be ready.
- `solution` `solve` `correct` (0 arguments) Solve the quizz, show it to each student and their associated good/bad responses.
- `search` `find` `grep` `list` `l` (1 argument, optionnal) Search a student by name or ID. Searching for `*` shows everyone. When not given, it defaults to `*`. It will also show the current mark, remaining time, and IP address.
- `disconnect` `kill` `reset` (1 argument) Delete a student data (if he clicked on an other name for example). He will have to refresh his page to see the changes, however.
- `timeadd` `addtime` (2 arguments) Add time for a student. The first parameter is the name or ID of the student (like `search`) and the second is the number of minutes to add. Negative numbers are allowed here.
- `q` `close` `quit` `exit` (0 arguments) Quit the quizz, stop the server and shutdown.

##Files syntax

You should look at the files inside the `demo` directory to see some examples of files.

Each question and response will be displayed through a markdown renderer, so you can use the markdown syntax here.

##Notes about the behavior of pop-quizz

When you select a student name, the IP address is linked to this student, so when reloading the page, it will directly show the quizz, and not the students list anymore. Also if this student finished the quizz, it will show its mark.

When a student is connected on an account, no one else can use this account until he disconnects.

While the quizz is running, the form is serialized and saved frequently, so a student won't lose its data if he run out of battery for example.

Every important action is logged, so you may know who is doing what (like when someone switch to an other tab or window) and take action if required.

The marks are also written in the log files, side by side with the remaining time for the quizz, when they submitted it. Also if a student reach the time limit, the quizz will be automatically submitted for him.

When a student checks all good responses and doesn't check the other ones, he gets one point. If he doesn't, he gets 0 for this question.
