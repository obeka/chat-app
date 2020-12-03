const fulldays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


function formatDate(someDateTimeStamp) {
    const dt = dt = new Date(someDateTimeStamp),
        date = dt.getDate(),
        month = months[dt.getMonth()],
        timeDiff = someDateTimeStamp - Date.now(),
        diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)),
        diffYears = new Date().getFullYear() - dt.getFullYear();

    if(diffYears === 0 && diffDays === 0){
      return "Today";
    }else if(diffYears === 0 && diffDays === -1) {
      return "Yesterday";
    }else if(diffYears === 0 && (diffDays < -1 && diffDays > -7)) {
      return fulldays[dt.getDay()];
    }else if(diffYears >= 1){
      return month + " " + date + ", " + new Date(someDateTimeStamp).getFullYear();
      }else {
        return month + " " + date;
      }
}

module.exports = formatDate;