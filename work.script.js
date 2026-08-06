let allExtraWork = [];

window.addEventListener("load",function(e){
    updateDate();
    updateTime();
    setInterval(updateTime, 1000);
})

function updateDate(){
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dayName = now.toLocaleDateString('en-US', {weekday: 'long'});
    const dayNum = now.toLocaleDateString('en-US', {day: 'numeric'});
    const month = now.toLocaleDateString('en-US', {month: 'long'});
    
    document.querySelector('.day-name').innerText = dayName;  
    document.querySelector('.day-num').innerText = dayNum;
    document.querySelector('.month').innerText = month;  

}

function updateTime(){
    const now = new Date();
    
    const hours = String(now.getHours()).padStart(2,'0');
    const min = String(now.getMinutes()).padStart(2,'0');
    const sec = String(now.getSeconds()).padStart(2,'0');
    
    const formatedTime = `${hours}:${min}`;
    document.querySelector(".time").innerText = formatedTime;
}

//stopwatch code
document.addEventListener('click',async function(e){
     let currentBox = e.target.closest(".container");
    if(!currentBox) return;
    
    if(currentBox){
        
    const startBtn = e.target.closest(".start-btn");
        let startI;
        let endI;
        let progPoint;
        let progTxt;
    if(startBtn){
       startI = startBtn.querySelector(".i-start");
     endI = startBtn.querySelector(".i-end");
      progPoint = currentBox.querySelector(".stat span");
        progTxt = currentBox.querySelector(".prog-txt");
        
        if(startI.classList.contains("hide") && endI.classList.contains("active")) {
            clearInterval(currentBox.timer);
            startI.classList.remove("hide");
            endI.classList.remove("active");
            progPoint.classList.remove("active");
            progPoint.classList.add("inactive");
            progTxt.innerText = "ON PAUSE";
        }
        else{
            stopWatch(currentBox);
            startI.classList.add("hide");
            endI.classList.add("active");
            progPoint.classList.add("active");
            progPoint.classList.remove("inactive");
            progTxt.innerText = "IN PROGRESS";
        }
    }
    }
    
    //set location
    
    const setBtn = e.target.closest(".arrow-icon");
    const card = currentBox.querySelector(".card-body");
    const location = currentBox.querySelector(".location");
    const newSetBtn = e.target.closest(".new-arrow-icon");
    
    if(setBtn){
        const icon = currentBox.querySelector(".new-arrow-icon");
        e.stopPropagation();
        if(location) location.classList.add("active");
        if(icon) icon.classList.add("open");
       if(setBtn) setBtn.classList.add("open");
        if(card) {
            card.classList.remove("close");
            card.classList.add("open");
        }
    }
    
    if(newSetBtn){
        const icon = currentBox.querySelector(".new-arrow-icon");
        const setBtn = currentBox.querySelector(".arrow-icon");
        e.stopPropagation();
        if(location) location.classList.remove("active");
        if(icon) icon.classList.remove("open");
        if(setBtn) setBtn.classList.remove("open");
        if(card) {
            card.classList.remove("open");
            card.classList.add("close");
        }
    }
    
    //auto location
    const autoLocationBtn = e.target.closest(".auto-location-btn");
    const autoLocation = currentBox.querySelectorAll(".place");
    
    if(autoLocationBtn){
        e.stopPropagation();
        
        if (navigator.geolocation) {
            
            autoLocationBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Getting location...';
            navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
            
        } 
        else {
            alert("Your browser does not support location services.");
        }
    }
    
    function successCallback(position) {
        const lat = position.coords.latitude;  
        const lng = position.coords.longitude; 
    
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`)
            .then(response => response.json()) 
            .then(data => {
                const address = data.address;
                
                const neighbourhood = address.neighbourhood || address.suburb || address.road || "";
                const state = address.state || address.governorate || address.city || "";
                const country = address.country || "";
                
                let fullAddress = "";
                if(neighbourhood) fullAddress += neighbourhood + ", ";
                if(state) fullAddress += state + ", ";
                if(country) fullAddress += country;

                if (autoLocation) {
                    autoLocation.forEach(function(location){
                        location.textContent = fullAddress;
                    });
                }
                autoLocationBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> My current location';
            })
            .catch(err => {
                console.error(err);
                autoLocationBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> My current location';
                alert("Unable to retrieve the address for these coordinates.");
            });
    }

    function errorCallback(error) {
        autoLocationBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> My current location';
        alert("Location access denied.");
    }
    
    
    
    //save information
    
    const saveBtn = e.target.closest(".register");
    if(saveBtn){
        let name = currentBox.querySelector(".recipient").innerText;
        let service = currentBox.querySelector(".service").innerText;
        let location = currentBox.querySelector(".place").innerText;
        currentBox.dataset.date = new Date().toISOString().split("T")[0];
        
        const min = parseInt(currentBox.dataset.min);
        const heur = parseInt(currentBox.dataset.heur);
        const totalTime = (heur*60) + min;
        let currentTime = new Date();
        let currentHeur = String(currentTime.getHours()).padStart(2,'0');
        let currentMin = String(currentTime.getMinutes()).padStart(2,'0');
        let totalCurrentTime = parseInt(currentHeur)* 60 + parseInt(currentMin);
        let totalStartedTime = (totalCurrentTime - totalTime + 1440) % 1440;
        let startHeur = String(Math.floor(totalStartedTime / 60)).padStart(2,'0');
        let startMin = String(totalStartedTime % 60).padStart(2,'0');
        
        currentBox.dataset.id = Date.now().toString();
        
        if(name === "" || location === "" || service === "") {
            alert("Please enter a valid information") ;
            return;
        }
        
        clearInterval(currentBox.timer);
        
        currentBox.setAttribute("data-min",0);
        currentBox.setAttribute("data-heur",0)
        currentBox.setAttribute("data-sec",0);
        
        let info = {
            id: currentBox.dataset.id,
            date: currentBox.dataset.date,
            name: name,
            service: service,
            location: location,
            startHeur: startHeur,
            startMin: startMin,
            heur: heur,
            min: min,
            currentHeur: currentHeur,
            currentMin: currentMin,
        };
        let currentTarget = allExtraWork.findIndex(function(target){
       return currentBox.dataset.id === target.id;
   })
    
    
       await getInfo(info,currentBox);
        
        
    currentBox.querySelector(".timer-display").innerText = "00:00:00";
    const startI = currentBox.querySelector(".i-start")
    const endI = currentBox.querySelector(".i-end");
    const progPoint = currentBox.querySelector(".stat span");
    const progTxt = currentBox.querySelector(".prog-txt");
    startI.classList.remove("hide");
    endI.classList.remove("active");
    progPoint.classList.remove("active");
    progTxt.innerText = "EMPTY";
        
        currentBox.querySelector(".recipient").innerText = "";
        currentBox.querySelector(".service").innerText = "";
        currentBox.querySelector(".place").innerText = "";

        
        showData(currentBox);
        countTotal(currentBox);
        clearTotal();
}
    
})


function stopWatch(currentBox){
    clearInterval(currentBox.timer);
    let sec = parseInt(currentBox.getAttribute("data-sec")) || 0;
    let min = parseInt(currentBox.getAttribute("data-min")) || 0;
    let heur = parseInt(currentBox.getAttribute("data-heur")) || 0;
    
    currentBox.timer = setInterval(function(){
        sec++;
        if(sec>=60){
            min++
            sec = 0;
        }
        if(min>=60){
            heur++;
            min = 0;
        }
        
        currentBox.setAttribute("data-sec",sec);
        currentBox.setAttribute("data-min",min);
        currentBox.setAttribute("data-heur",heur);
        
        const formatHeur = String(heur).padStart(2, '0');
        const formatMin = String(min).padStart(2, '0');
        const formatSec = String(sec).padStart(2, '0');
        
        currentBox.querySelector(".timer-display").innerText = `${formatHeur}:${formatMin}:${formatSec}`;
        
    },1000)
}

//search location
let debounceTimer;
document.addEventListener("input",function(e){
    const currentBox = e.target.closest(".container");
    const inputLocation = e.target.closest(".location-query");
    if(inputLocation){
        const locationSuggestions = currentBox.querySelector(".suggestions-list");
        let inputValue = e.target.value.trim();
    
    clearTimeout(debounceTimer);
    if(inputValue.length < 2)
    {
        locationSuggestions.innerHTML = "";
        return;
    }
    
    debounceTimer = setTimeout(function(){
        fetchPlaces(inputValue,currentBox); 
    },600)
    }
})


 document.addEventListener('click', function(e) {
     let inputLocation = e.target.closest(".location-query");
     
    if (e.target !== inputLocation) {
        document.querySelectorAll(".suggestions-list").forEach(function(list){
            list.innerHTML = '';
        })
    }
 });
function fetchPlaces(inputValue,currentBox){
    fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(inputValue)}&limit=5&lang=en`)
    .then(response => response.json())
    .then(data =>{
        displaySeggestions(data.features,currentBox)
    })
   .catch(err => console.error("Error fetching suggestions:", err));
}
     
function displaySeggestions(features,currentBox){
    let locationSuggestions = currentBox.querySelector(".suggestions-list");
    let inputLocation = currentBox.querySelector(".location-query");
    let autoLocation = currentBox.querySelectorAll(".place");
    locationSuggestions.innerHTML = "";
    if(features.length === 0){
        let wearning = document.createElement("li");
        wearning.innerText = "No places found";
        wearning.className = "no-results";
        locationSuggestions.appendChild(wearning);
    }
    
    features.forEach(function(feature){
        
        let props = feature.properties;
        
        let name = props.name || "";
        let city = props.city || props.state || props.road || "";
        let country = props.country || "";
        
        let currentLocation = [name,city,country].filter(Boolean).join(",");
        
        const li = document.createElement("li");
        li.innerText = currentLocation;
        locationSuggestions.appendChild(li);
        
        li.addEventListener("click",function(){
            inputLocation.value = currentLocation;
            autoLocation.forEach(function(location){
                location.innerText = currentLocation;
                locationSuggestions.innerHTML = "";
                
            })
        })
    })

}
//save data
document.addEventListener("change",function(e){
    const calendrier = e.target.closest(".calendrier");
    if(calendrier){
        let currentBox = calendrier.closest(".container");
        showData(currentBox);
        clearTotal();
        countTotal(currentBox);
    }
})

function showData(currentBox) {
    let result = currentBox.querySelector(".project-container");
    result.innerHTML = "";
    let calendrier = currentBox.querySelector(".calendrier");
    let selectDate = (calendrier && calendrier.value) ? calendrier.value : new Date().toISOString().split("T")[0];

    let currentDate = allExtraWork.filter(function(target) {
        return selectDate === target.date;
    });

    currentDate.forEach(function(elem) {
        let finalInfo = `
        <div class="project" data-id="${elem.id}">
            <div class="project-info">
                <div class="project-name" >${elem.name}</div>
                <div class="details">
                    <span class="ville" >${elem.location}</span>
                    <span class="point"></span>
                    <span class="service-client" >${elem.service}</span>
                </div>
                <div class="project-time">
                    <span class="entre">
                        <span class="entre-h" >${elem.startHeur}</span>:<span class="entre-m" >${elem.startMin}</span>
                    </span>
                    <span class="comma"></span>
                    <span class="sorti">
                        <span class="sorti-h" >${elem.currentHeur}</span>:<span class="sorti-m" >${elem.currentMin}</span>
                    </span>
                </div>
            </div>
            <div class="durée">
                <span class="heur" >${elem.heur}</span><span>h</span>
                <span class="min" >${elem.min}</span><span>m</span>
            </div>
        </div>`;
        result.insertAdjacentHTML("beforeend", finalInfo);
    });
}
    
    window.addEventListener("load", function() {
    document.querySelectorAll(".container").forEach(box => {
        showData(box);
        countTotal(box);
        clearTotal();
    });
});



function countTotal(currentBox){
    if(!currentBox) return;
    const total = currentBox.querySelector(".total-hrs");
    total.innerText = "";
    const calendrier = currentBox.querySelector(".calendrier");
    let selectedDate = calendrier.value || new Date().toISOString().split("T")[0];
    
    let currentTotalTime = allExtraWork.filter(function(target){
        
       return target.date === selectedDate;
    })
    
    let totalH = 0 ;
    let totalM = 0;
    currentTotalTime.forEach(function(time){
        totalH += parseInt(time.heur) || 0;
        totalM += parseInt(time.min) || 0;
    })
    totalH += Math.floor(totalM / 60);
    totalM = totalM % 60;
    
    total.innerText = `${totalH}h ${totalM}m`;
}

let touchTimer;
let projectTarget;
document.addEventListener("pointerdown",function(e){
    const currentBox = e.target.closest(".container");
    if(!currentBox) return;
    let overlay = currentBox.querySelector(".overlay");
    let project = e.target.closest(".project");
    const options = currentBox.querySelector(".options")
    if(project){
        if(project.classList.contains("editing")){
            project.classList.add("no-before");
            return;
        }
        touchTimer = setTimeout(function(){
            showOptions(currentBox);
            project.classList.remove("no-before");
            options.classList.remove("close");
            overlay.classList.add("active");
            projectTarget = project;
        },250)
    }
})

document.addEventListener("pointerup",function(e){
    const currentBox = e.target.closest(".container");
    if(!currentBox) return;
    let project = e.target.closest(".project");
    if(project){
        clearTimeout(touchTimer);
    }
})

document.addEventListener("pointerleave",function(e){
    const currentBox = e.target.closest(".container");
    if(!currentBox) return;
    let project = e.target.closest(".project");
    if(project){
        clearTimeout(touchTimer);
    }
})

document.addEventListener("pointercancel",function(e){
    const currentBox = e.target.closest(".container");
    if(!currentBox) return;
    let project = e.target.closest(".project");
    if(project){
        clearTimeout(touchTimer);
    }
})

function showOptions(currentBox){
    let options = currentBox.querySelector(".options");
    setTimeout(function(){
        options.style.opacity = "1";
    },300)
    options.classList.add("active");
}

//close overlay
let editing = false;
document.addEventListener("click",function(e){
    let overlay = e.target.closest(".overlay");
    if(!overlay) return;
    let currentBox = overlay.closest(".container");
    let options = currentBox.querySelector(".options");
    let confirmBox = currentBox.querySelector(".confirm-box");
    if(overlay){
        options.classList.remove("active");
        options.classList.add("close");
        overlay.classList.remove("active");
        confirmBox.classList.remove("active");
        confirmBox.classList.add("close");
    }
})


function editItem(editBtn){
    if(!editBtn) return;
    if(!projectTarget) return;
    const currentBox = editBtn.closest(".container");
    const options = currentBox.querySelector(".options");
    const overlay = currentBox.querySelector(".overlay");
    const check = currentBox.querySelector(".check-btn");
    const calendrier = currentBox.querySelector(".calendrier-icon");
    
    options.classList.remove("active");
    options.classList.add("close");
    projectTarget.classList.add("editing");
    overlay.classList.remove("active");
    calendrier.classList.add("close");
    check.classList.add("open");

    projectTarget.querySelectorAll(
        ".project-name, .ville, .service-client, .entre-h, .entre-m, .sorti-h, .sorti-m, .heur, .min"
    ).forEach(function(item){
        item.contentEditable = "true";
    });
    
}

document.addEventListener("click",async function(e){
    let check = e.target.closest(".check-btn");
    if(!check) return;
    if(!projectTarget) return;
    let currentBox = check.closest(".container");
    if(check){
        const client = projectTarget.querySelector(".project-name").innerText;
        const ville = projectTarget.querySelector(".ville").innerText;
        const service = projectTarget.querySelector(".service-client").innerText;
        const startHeur = projectTarget.querySelector(".entre-h").innerText;
        const startMin = projectTarget.querySelector(".entre-m").innerText;
        const endHeur = projectTarget.querySelector(".sorti-h").innerText;
        const endMin = projectTarget.querySelector(".sorti-m").innerText;
        const workedHeur = projectTarget.querySelector(".heur").innerText;
        const workedMin = projectTarget.querySelector(".min").innerText;
            
        const check = currentBox.querySelector(".check-btn");
        const calendrier = currentBox.querySelector(".calendrier-icon");
        
        let id = projectTarget.dataset.id;
       
            
            let newBox = allExtraWork.findIndex(function(target){
            return target.id === projectTarget.dataset.id;
        })
            
        if(newBox !== -1){
            
        let newInfo = {
            id: id,
            name: client,
            service: service,
            location: ville,
            startHeur: startHeur,
            startMin: startMin,
            heur: workedHeur,
            min: workedMin,
            currentHeur: endHeur,
            currentMin: endMin,
            date: allExtraWork[newBox].date,
        }
            allExtraWork[newBox] = newInfo;
            await updateInfo(newInfo,projectTarget.dataset.id)
        }
        
       
            
        countTotal(currentBox);
        showData(currentBox);
        
        projectTarget.classList.remove("editing");
        projectTarget.classList.add("no-before");
        check.classList.remove("open");
        calendrier.classList.remove("close");
        
        projectTarget.querySelectorAll(
        ".project-name, .ville, .service-client, .entre-h, .entre-m, .sorti-h, .sorti-m, .heur, .min"
    ).forEach(function(item){
        item.contentEditable = "false";
    });
    }
    
})

function confirmDeletion(removeBtn){
    if(!removeBtn) return;
    if(!projectTarget) return;
  
    const currentBox = removeBtn.closest(".container");
    const options = currentBox.querySelector(".options");
    const confirmBox = currentBox.querySelector(".confirm-box");
    
    options.classList.remove("active");
    options.classList.add("close");
    confirmBox.classList.remove("close");
    confirmBox.classList.add("active");
    
}

function deleteOption(removeBtn){
    if(!removeBtn) return;
    if(!projectTarget) return;
    
    const currentBox = removeBtn.closest(".container");
    const confirmBox = currentBox.querySelector(".confirm-box");
    const overlay = currentBox.querySelector(".overlay");
    const options = currentBox.querySelector(".options");
    
    options.classList.remove("active");
    options.classList.add("close");
    confirmBox.classList.remove("close");
    confirmBox.classList.add("active");
}

function confirmDelete(yesBtn){
    if(!yesBtn) return;
    if(!projectTarget) return;
    
    const currentBox = yesBtn.closest(".container");
    let currentProject = allExtraWork.findIndex(function(project){
        return projectTarget.dataset.id === project.id;
    })
    if(currentProject === -1) return;
    allExtraWork.splice(currentProject,1);
    deleteInfo(projectTarget.dataset.id)
    projectTarget.remove();
    
    const confirmBox = currentBox.querySelector(".confirm-box");
    const overlay = currentBox.querySelector(".overlay");
    
    confirmBox.classList.remove("active");
    confirmBox.classList.add("close");
    overlay.classList.remove("active");
    
    projectTarget = null;
    clearTotal();
}


function closeConfirm(noBtn){
    
    if(!noBtn) return;
    
    const currentBox = noBtn.closest(".container");
    const confirmBox = currentBox.querySelector(".confirm-box");
    const overlay = currentBox.querySelector(".overlay");
    
    confirmBox.classList.remove("active");
    confirmBox.classList.add("close");
    overlay.classList.remove("active");
    
    clearTotal();

}

function clearTotal(){
document.querySelectorAll(".result").forEach(function(project){
    let containerProject = project.querySelector(".project-container");
    let total = project.querySelector(".total");
    if(containerProject.innerHTML.trim() === ""){
        total.classList.add("hide");
    }
    else{
        total.classList.remove("hide");
    }
})
    
}

async function getInfo(info,currentBox){
    try{
        const response = await fetch("https://jsonplaceholder.typicode.com/todos",{
            method: "POST",
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify(info),
        }) ;
        if(!response.ok) throw new Error("something went wrong");
        
        const creatInfo = await response.json();
        creatInfo.id = info.id;
        allExtraWork.push(creatInfo);
        showData(currentBox);
        return creatInfo;
        }catch(error){
            alert(error.message);
        }
}

async function updateInfo(info,id){
    try{
        const response = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`,{
            method: "PATCH",
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify(info),
        }) ;
        if(!response.ok) throw new Error("something went wrong");
        
        const patchedData = await response.json();
        
        }catch(error){
            alert(error.message);
        }
}

async function deleteInfo(id){
    try{
        const response = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`,{
            method: "DELETE",
            headers: {'Content-type': 'application/json'},
        }) ;
        if(!response.ok) throw new Error("something went wrong");
        }catch(error){
            alert(error.message);
        }
}

