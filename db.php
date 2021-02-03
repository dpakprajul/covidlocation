<?php
$server = 'localhost';
$username = 'Postgres';
$password = 'admin';
$db_name = 'covid19';
$dbconn = pg_connect("host=$server port=5432 dbname=$db_name user=$username password=$password")

?>