$(function () {
    var includes = $('[data-include]')
    $.each(includes, function () {
      var file = 'views/' + $(this).data('include') + '.html'
      $(this).load(file)
    })
  })
  /* Credit: https://stackoverflow.com/questions/8988855/include-another-html-file-in-a-html-file */