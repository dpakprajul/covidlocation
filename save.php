<?php

include 'db.php';

$name = $_POST['name'];
$condition = $_POST['condition'];
$long = $_POST['long'];
$lat = $_POST['lat'];
$add_query = "INSERT INTO public.enteries(name, condition, geom)VALUES ('$name','$condition',ST_MakePoint($long,$lat))";

$query = pg_query($dbconn,$add_query)

// if($query){
//     echo json_encode(array("statusCode"=>200));
// }else{
//     echo json_encode(array("statusCode"=>201));
// }

?>