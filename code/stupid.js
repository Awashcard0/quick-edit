function temp() {
    var y = document.getElementById("del");
    text = document.getElementById("text");
    y.innerHTML = "Added"
    text.value = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Document</title>
<style>

</style>
<script>

</script>
</head>
<body>

</body>
</html>`;
    text.select();
    y.className = "show";
    setTimeout(function() {
      y.className = y.className.replace("show", "");
    }, 3000);
  }