const SUPABASE_URL = "https://mufwtnafxiprsmmuatih.supabase.co
const SUPABASE_KEY = "sb_publishable_kWqvn3MUMdTT9fZuwIsJ_A_dEOK04tu";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const email = document
            .getElementById("email")
            .value
            .trim();

        const password = document
            .getElementById("password")
            .value;

        const message =
            document.getElementById("message");

        message.textContent = "Logging in...";


        try {

            const { data, error } =
                await supabaseClient.auth
                    .signInWithPassword({
                        email: email,
                        password: password
                    });


            if (error) {

                console.error(error);

                message.textContent =
                    "Login failed: " + error.message;

                return;
            }


            if (!data.user) {

                message.textContent =
                    "Login failed. No user was returned.";

                return;
            }


            message.textContent =
                "Login successful. Opening dashboard...";


            const { data: profile, error: profileError } =
                await supabaseClient
                    .from("profiles")
                    .select("full_name, role")
                    .eq("id", data.user.id)
                    .single();


            if (profileError) {

                console.error(profileError);

                message.textContent =
                    "Profile error: " +
                    profileError.message;

                return;
            }


            console.log("Logged-in profile:", profile);


            if (profile.role === "admin") {

                window.location.replace("admin.html");

                return;
            }


            if (profile.role === "teacher") {

                window.location.replace("teacher.html");

                return;
            }


            if (profile.role === "student") {

                window.location.replace("student.html");

                return;
            }


            message.textContent =
                "Your account has an unknown role.";

        }

        catch (error) {

            console.error(error);

            message.textContent =
                "Unexpected error: " +
                error.message;

        }

    });

}


// ===============================
// ADMIN ACCESS
// ===============================

async function checkAdminAccess() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();


    if (!session) {

        window.location.href = "login.html";

        return;
    }


    const {
        data: profile,
        error
    } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();


    if (
        error ||
        !profile ||
        profile.role !== "admin"
    ) {

        alert(
            "You are not authorized to access this page."
        );

        await supabaseClient.auth.signOut();

        window.location.href = "login.html";

        return;
    }


    // Load classes after admin access is confirmed
    loadClasses();

    // Load students
    loadStudents();

}


// ===============================
// LOAD CLASSES
// ===============================

async function loadClasses() {

    const classSelect =
        document.getElementById("studentClass");


    if (!classSelect) {

        console.log(
            "Student class dropdown not found."
        );

        return;
    }


    classSelect.innerHTML =
        '<option value="">Loading classes...</option>';


    const {
        data,
        error
    } = await supabaseClient
        .from("classes")
        .select("id, name")
        .order("id");


    if (error) {

        console.error(
            "Class loading error:",
            error
        );

        classSelect.innerHTML =
            '<option value="">Unable to load classes</option>';

        return;
    }


    console.log(
        "Classes received:",
        data
    );


    classSelect.innerHTML =
        '<option value="">Select Class</option>';


    data.forEach(function(classItem) {

        const option =
            document.createElement("option");


        option.value =
            classItem.id;


        option.textContent =
            classItem.name;


        classSelect.appendChild(option);

    });

}


// ===============================
// LOAD STUDENTS
// ===============================

async function loadStudents() {

    const studentList =
        document.getElementById("studentList");


    if (!studentList) {
        return;
    }


    studentList.textContent =
        "Loading students...";


    const {
        data,
        error
    } = await supabaseClient
        .from("students")
        .select(`
            id,
            admission_number,
            full_name,
            email,
            classes (
                name
            )
        `)
        .order("full_name");


    if (error) {

        console.error(
            "Student loading error:",
            error
        );

        studentList.textContent =
            "Unable to load students.";

        return;
    }


    if (!data || data.length === 0) {

        studentList.textContent =
            "No students have been added yet.";

        return;
    }


    studentList.innerHTML = "";


    data.forEach(function(student) {

        const div =
            document.createElement("div");


        div.className =
            "student-item";


        div.innerHTML = `
            <strong>${student.full_name}</strong><br>
            Admission No: ${student.admission_number}<br>
            Class: ${student.classes?.name || "Not assigned"}<br>
            Email: ${student.email || "Not provided"}
        `;


        studentList.appendChild(div);

    });

}


// ===============================
// ADD STUDENT
// ===============================

const studentForm =
    document.getElementById("studentForm");


if (studentForm) {

    studentForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const admission =
                document
                    .getElementById("studentAdmission")
                    .value
                    .trim();


            const name =
                document
                    .getElementById("studentName")
                    .value
                    .trim();


            const classId =
                document
                    .getElementById("studentClass")
                    .value;


            const email =
                document
                    .getElementById("studentEmail")
                    .value
                    .trim();


            const message =
                document.getElementById(
                    "studentMessage"
                );


            message.textContent =
                "Saving student...";


            const {
                error
            } = await supabaseClient
                .from("students")
                .insert({

                    admission_number:
                        admission,

                    full_name:
                        name,

                    class_id:
                        classId,

                    email:
                        email || null

                });


            if (error) {

                console.error(
                    "Student insert error:",
                    error
                );

                message.textContent =
                    "Error: " + error.message;

                return;
            }


            message.textContent =
                "Student added successfully!";


            studentForm.reset();


            loadStudents();

        }
    );

}


// ===============================
// LOGOUT
// ===============================

const logoutButton =
    document.getElementById("logoutButton");


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function() {

            await supabaseClient.auth.signOut();

            window.location.href =
                "login.html";

        }
    );

}


// ===============================
// RUN ADMIN CHECK
// ===============================

if (
    window.location.pathname.endsWith(
        "admin.html"
    )
) {

    checkAdminAccess();

}// ===============================
// SUBJECT MANAGEMENT
// ===============================

async function loadSubjects() {

    const subjectList =
        document.getElementById("subjectList");

    if (!subjectList) return;

    const { data, error } =
        await supabaseClient
            .from("subjects")
            .select("id, name, code")
            .order("name");

    if (error) {

        console.error(error);

        subjectList.textContent =
            "Unable to load subjects.";

        return;
    }

    if (!data || data.length === 0) {

        subjectList.textContent =
            "No subjects have been added yet.";

        return;
    }

    subjectList.innerHTML = "";

    data.forEach(function(subject) {

        const div =
            document.createElement("div");

        div.className = "student-item";

        div.innerHTML = `
            <strong>${subject.name}</strong><br>
            Subject Code:
            ${subject.code || "Not provided"}
        `;

        subjectList.appendChild(div);

    });
}


const subjectForm =
    document.getElementById("subjectForm");


if (subjectForm) {

    loadSubjects();

    subjectForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const name =
                document
                    .getElementById("subjectName")
                    .value
                    .trim();

            const code =
                document
                    .getElementById("subjectCode")
                    .value
                    .trim();

            const message =
                document.getElementById(
                    "subjectMessage"
                );

            message.textContent =
                "Saving subject...";


            const { error } =
                await supabaseClient
                    .from("subjects")
                    .insert({

                        name: name,

                        code: code || null

                    });


            if (error) {

                console.error(error);

                message.textContent =
                    "Error: " + error.message;

                return;
            }


            message.textContent =
                "Subject added successfully!";


            subjectForm.reset();

            loadSubjects();

        }
    );

}async function checkTeacherAccess() {

    const {
        data: {
            session
        }
    } = await supabaseClient.auth.getSession();


    if (!session) {

        window.location.href = "login.html";

        return;
    }


    const {
        data: profile,
        error
    } = await supabaseClient

        .from("profiles")

        .select("full_name, role")

        .eq("id", session.user.id)

        .single();


    if (
        error ||
        !profile ||
        profile.role !== "teacher"
    ) {

        alert(
            "You are not authorized to access the teacher portal."
        );

        await supabaseClient.auth.signOut();

        window.location.href = "login.html";

        return;
    }


    const nameDisplay =
        document.getElementById(
            "teacherNameDisplay"
        );


    if (nameDisplay) {

        nameDisplay.textContent =
            "Logged in as " +
            profile.full_name;

    }

}


if (
    window.location.pathname.endsWith(
        "teacher.html"
    )
) {

    checkTeacherAccess();

}