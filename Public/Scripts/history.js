$(document).ready(function () {
    $("#search").on("keyup", function () {
        var searchTerm = $(this).val().toLowerCase();
        $("#resultsContainer .rectangle").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(searchTerm) > -1)
        });
    });
});