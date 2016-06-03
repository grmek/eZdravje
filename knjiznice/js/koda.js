var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
             "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generirajPodatke(stPacienta) {
    var sessionId = getSessionId();
    var ehrId, ime, priimek, datumRojstva, datumInUra, sistolicniKrvniTlak, diastolicniKrvniTlak;

    //nastavi podatke glede na 'stPacienta'
    switch(stPacienta) {
        case 1:
            ime = "Jan";
            priimek = "Čuk";
            datumRojstva = "1996-07-08T09:21";
            datumInUra = [ "2016-05-25T08:32", "2016-05-26T08:29",
                           "2016-05-27T08:31", "2016-05-28T08:23",
                           "2016-05-29T08:33", "2016-05-30T08:27",
                           "2016-05-31T08:28" ];
            sistolicniKrvniTlak = [ 143, 146, 147, 141, 144, 145, 139 ];
            diastolicniKrvniTlak = [ 92, 89, 95, 91, 93, 96, 92 ];
            break;
        case 2:
            ime = "Erik";
            priimek = "Bolčič";
            datumRojstva = "1996-11-22T11:21";
            datumInUra = [ "2016-05-25T08:32", "2016-05-26T08:29",
                           "2016-05-27T08:31", "2016-05-28T08:23",
                           "2016-05-29T08:33", "2016-05-30T08:27",
                           "2016-05-31T08:28" ];
            sistolicniKrvniTlak = [ 109, 112, 108, 110, 104, 113, 106 ];
            diastolicniKrvniTlak = [ 63, 64, 66, 64, 65, 63, 61 ];
            break;
        case 3:
            ime = "Luka";
            priimek = "Benčina";
            datumRojstva = "1996-01-12T17:43";
            datumInUra = [ "2016-05-25T08:32", "2016-05-26T08:29",
                           "2016-05-27T08:31", "2016-05-28T08:23",
                           "2016-05-29T08:33", "2016-05-30T08:27",
                           "2016-05-31T08:28" ];
            sistolicniKrvniTlak = [ 91, 89, 87, 85, 86, 88, 90 ];
            diastolicniKrvniTlak = [ 55, 57, 53, 54, 59, 58, 54 ];
            break;
        default:
            console.log("Napacna stPacienta");
            return "";
    }

    //generiraj ehrId z zgornjimi podatki (ime, priimek, datumRojstva)
    $.ajaxSetup({
        headers: {"Ehr-Session": sessionId}
    });
    $.ajax({
        url: baseUrl + "/ehr",
        type: 'POST',
        async: false,
        success: function (data) {
            ehrId = data.ehrId;
            var partyData = {
                firstNames: ime,
                lastNames: priimek,
                dateOfBirth: datumRojstva,
                partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
            };
            $.ajax({
                url: baseUrl + "/demographics/party",
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(partyData),
                success: function (party) {
                    if (party.action == 'CREATE') {
                        console.log("Uspesno generiran ehrId " + ehrId + ".");
                        for(var i=0; i<7; i++){
                            dodajMeritveVitalnihZnakov(sessionId, ehrId, datumInUra[i], sistolicniKrvniTlak[i], diastolicniKrvniTlak[i]);
                        }
                    }
                },
                error: function(err) {
                    ehrId = "";
                    console.log("Napaka pri generiranju ehrId-ja.");
                }
            });
        }
    });

    return ehrId;
}

function dodajMeritveVitalnihZnakov(sessionId, ehrId, datumInUra, sistolicniKrvniTlak, diastolicniKrvniTlak) {
    $.ajaxSetup({
        headers: {"Ehr-Session": sessionId}
    });
    var podatki = {
        "ctx/language": "en",
        "ctx/territory": "SI",
        "ctx/time": datumInUra,
        "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
        "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak
    };
    var parametriZahteve = {
        ehrId: ehrId,
        templateId: 'Vital Signs',
        format: 'FLAT',
        committer: 'Generator'
    };
    $.ajax({
        url: baseUrl + "/composition?" + $.param(parametriZahteve),
        type: 'POST',
        async: false,
        contentType: 'application/json',
        data: JSON.stringify(podatki),
        success: function (res) {
            console.log("Uspesno dodana meritev.");
        },
        error: function(err) {
            console.log("Napaka pri dodajanju meritve");
        }
    });
}

function generirajVsePodatke() {
    var ehrId1 = generirajPodatke(1);
    var ehrId2 = generirajPodatke(2);
    var ehrId3 = generirajPodatke(3);
    $('#vzorcneOsebe').html('<option value=""></option>\
                             <option value="'+ehrId1+'">Jan Čuk</option>\
                             <option value="'+ehrId2+'">Erik Bolčič</option>\
                             <option value="'+ehrId3+'">Luka Benčina</option>');
    $('#ehrId').val(ehrId1);
    alert("Vzorčne osebe uspešno generirane!");
}

function prikaziPodatke() {
    var ehrId = $('#ehrId').val();

    if(ehrId!=""){
        var meritve = preberiMeritve(getSessionId(), ehrId);

        //dodaj vse meritve na seznam z datumi
        var list = "";
        for(var i in meritve){
            list += '<option value="'+meritve[i].diastolic+';'+meritve[i].systolic+'">'+meritve[i].time+'</option>';
        }
        $('#meritevZaDatum').css("display", "block");
        $('#izberiDatum').html(list);
        $('#meritev').html('<br>Diastolični krvni tlak: '+meritve[0].diastolic+
                           '<br>Sistolični krvni tlak: '+meritve[0].systolic);

        //pripravi podatke za graf  in izracunaj povprecna tlaka
        var len = meritve.length;
        if(len>5){
            len = 5;
        }
        var podatki = [ ['', ''] ];
        var avgSys = 0;
        var avgDia = 0;
        for(var i=0; i<len; i++){
            podatki.push( [meritve[i].systolic, meritve[i].diastolic] );
            avgSys += meritve[i].systolic;
            avgDia += meritve[i].diastolic;
        }
        avgSys /= len;
        avgDia /= len;

        //prikazi analizo
        $('#analiza').css("display", "block");

        //narisi graf
        drawChart(podatki);

        //izpisi povprecje
        $('#povprecje').html('Povprečje za zadnjih '+len+' meritev'+
                             '<br>Diastolični krvni tlak: '+avgDia+
                             '<br>Sistolični krvni tlak: '+avgSys);

        //pripravi in izpisi povzetek
        var opis;
        if(avgSys>140 || avgDia>90) {
            opis = 'previsok';
        } else if(avgSys>120 || avgDia>80) {
            opis = 'rahlo povišan';
        } else if(avgSys>90 || avgDia>60) {
            opis = 'idealen';
        } else {
            opis = 'prenizek';
        }
        $('#povzetek').html('<b>Vaš krvni tlak je '+opis+'.</b><br>');

        //ce je potrebno, dodaj nasvet iz zunanjega vira
        if(opis=='previsok' || opis=='rahlo povišan'){
            var data = preberiCSV("zunanji_vir/previsok.csv");
            var random = Math.floor(Math.random() * data.length);
            $('#povzetek').append('<br>Nasvet: <b>'+data[random][0]+'</b><br>'+
                                   data[random][1]+'<br>');
        }
        if(opis=='prenizek'){
            var data = preberiCSV("zunanji_vir/prenizek.csv");
            var random = Math.floor(Math.random() * data.length);
            $('#povzetek').append('<br>Nasvet: <b>'+data[random][0]+'</b><br>'+
                                   data[random][1]+'<br>');
        }

    }

}

function preberiMeritve(sessionId, ehrId) {
    var meritve;
    $.ajax({
        url: baseUrl + "/view/" + ehrId + "/blood_pressure",
        type: 'GET',
        async: false,
        headers: {"Ehr-Session": sessionId},
        success: function (res) {
            for (var i in res) {
                meritve = res;
            }
        }
    });
    return meritve;
}

function preberiCSV(path) {
    var data;
    $.ajax({
        url: path,
        async: false,
        success: function (csvd) {
            data = csvd;
        },
        dataType: "text",
    });
    data = data.split(/\r\n|\n/);
    for(var i in data){
        data[i] = data[i].split(';');
    }
    return data;
}

$(document).ready(function() {

    $('#vzorcneOsebe').change(function() {
        $('#ehrId').val($(this).val());
    });

    $('#izberiDatum').change(function() {
        var tlak = $(this).val().split(';');
        $('#meritev').html('<br>Diastolični krvni tlak: '+tlak[0]+
                           '<br>Sistolični krvni tlak: '+tlak[1]);
    });

});

