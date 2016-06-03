
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
            ime = "Janez";
            priimek = "Novak";
            datumRojstva = "1944-11-22T11:21";
            datumInUra = [ "1998-10-30T14:43", "1998-10-30T14:55",
                           "1998-10-30T14:58", "1998-10-30T15:09",
                           "1998-10-30T15:10", "1998-10-30T15:11",
                           "1998-10-30T15:12" ];
            sistolicniKrvniTlak = [ 131, 132, 133, 134, 135, 136, 137 ];
            diastolicniKrvniTlak = [ 81, 82, 83, 84, 85, 86, 87 ];
            break;
        case 2:
            ime = "Janez";
            priimek = "Novak";
            datumRojstva = "1944-11-22T11:21";
            datumInUra = [ "1998-10-30T14:43", "1998-10-30T14:55",
                           "1998-10-30T14:58", "1998-10-30T15:09",
                           "1998-10-30T15:10", "1998-10-30T15:11",
                           "1998-10-30T15:12" ];
            sistolicniKrvniTlak = [ 131, 132, 133, 134, 135, 136, 137 ];
            diastolicniKrvniTlak = [ 81, 82, 83, 84, 85, 86, 87 ];
            break;
        case 3:
            ime = "Janez";
            priimek = "Novak";
            datumRojstva = "1944-11-22T11:21";
            datumInUra = [ "1998-10-30T14:43", "1998-10-30T14:55",
                           "1998-10-30T14:58", "1998-10-30T15:09",
                           "1998-10-30T15:10", "1998-10-30T15:11",
                           "1998-10-30T15:12" ];
            sistolicniKrvniTlak = [ 131, 132, 133, 134, 135, 136, 137 ];
            diastolicniKrvniTlak = [ 81, 82, 83, 84, 85, 86, 87 ];
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
    $('#vzorcneOsebe').html('');
    $('#vzorcneOsebe').append('<option value="'+ehrId1+'">POPRAVI IME</option>\
                               <option value="'+ehrId2+'">Janez Novak</option>\
                               <option value="'+ehrId3+'">Janez Novak</option>');
    $('#ehrId').val(ehrId1);
}

function prikaziPodatke() {
    var meritve = preberiMeritve(getSessionId(), $('#ehrId').val());
    var list = "";
    for(var i in meritve){
        list += '<option value="'+meritve[i].diastolic+';'+meritve[i].systolic+'">'+meritve[i].time+'</option>';
    }

    $('#meritevZaDatum').css("display", "block");
    $('#izberiDatum').append(list);
    $('#meritev').html('<br>Diastolični krvni tlak: '+meritve[0].diastolic+
                       '<br>Sistolični krvni tlak: '+meritve[0].systolic);


    $('#analiza').css("display", "block");
    
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

$(document).ready(function() {

    console.log( "document loaded" );

    $('#vzorcneOsebe').change(function() {
        $('#ehrId').val($(this).val());
    });

    $('#izberiDatum').change(function() {
        var tlak = $(this).val().split(';');
        $('#meritev').html('<br>Diastolični krvni tlak: '+tlak[0]+
                           '<br>Sistolični krvni tlak: '+tlak[1]);
    });

});
