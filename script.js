let nmbr = Math.floor(Math.random()*20)
let score = 20
let highscore =0
document.querySelector(".btn_check").addEventListener("click", ()=> {
    let guess = document.querySelector(".guess").value

    if (guess==false){
        document.querySelector(".message").textContent="no number"
    }
    else if (guess==nmbr){
        document.querySelector(".message").textContent="you solve the riddle!!!"
        document.body.style.background="green"
        document.querySelector(".number").textContent=nmbr
        if(guess==nmbr){
            let muultiply= score*3
            document.querySelector(".highscore").textContent=muultiply
        }
        
        
    }
    else if (guess>nmbr){
        if (score>=0){
        document.querySelector(".message").textContent="number is Lower"
        score=score-1
        document.querySelector(".score").textContent=score
    }
    else{
        document.querySelector(".message").textContent="u lost"
        
    }
    }
    else if(guess<nmbr){
        if (score>=0){
            document.querySelector(".message").textContent="number is Higher"
            score=score-1
            document.querySelector(".score").textContent=score
        }
        else{
            document.querySelector(".message").textContent="u lost"
            
        }
    }
})




console.log(nmbr)