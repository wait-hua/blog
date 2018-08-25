import addClass from 'dom101/add-class'
import removeClass from 'dom101/remove-class'
import hasClass from 'dom101/has-class'
import toggleClass from 'dom101/toggle-class'

function toggleReward(){
    let _ele = document.querySelector('.tooltip-award');
    if(hasClass(_ele, 'tooltip-award-easeIn')){
        removeClass(_ele, 'tooltip-award-easeIn');
        addClass(_ele, 'tooltip-award-easeOut');
    } else {
        addClass(_ele, 'tooltip-award-easeIn');
        removeClass(_ele, 'tooltip-award-easeOut');
    }
}

let init = function(){
    // var rewardBtn = document.getElementByClassName('page-reward-btn')[0];
    // rewardBtn.addEventListener('click', function(){
    //     alert('ss');
    // })
    document.querySelector('.page-reward-btn').onclick = toggleReward;
};

module.exports = {
    init: init
}
