DEFINE BUCKET IF NOT EXISTS chat_documents BACKEND "memory"
  PERMISSIONS WHERE
    $action NOT IN ['put']
    OR (
      file::head($file).size <= 15728640
      AND (
        string::ends_with(file::key($file), '.jpg')
        OR         string::ends_with(file::key($file), '.jpeg')
        OR         string::ends_with(file::key($file), '.png')
        OR         string::ends_with(file::key($file), '.csv')
        OR         string::ends_with(file::key($file), '.pdf')
        OR         string::ends_with(file::key($file), '.txt')
      )
    );
