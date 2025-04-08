{
  feedbacks
    ?.filter((a) =>
      a.changes?.some(
        (id) =>
          (deliverables?.photos.map((x) => x.id)?.includes(id) &&
            deliverables?.photos?.find((x) => x.id === id).status === 'REVISION_REQUESTED') ||
          (deliverables?.videos.map((x) => x.id)?.includes(id) &&
            deliverables?.videos?.find((x) => x.id === id).status === 'REVISION_REQUESTED') ||
          (deliverables?.rawFootages.map((x) => x.id)?.includes(id) &&
            deliverables?.rawFootages?.find((x) => x.id === id).status === 'REVISION_REQUESTED')
      )
    )
    ?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((feedback, index) => (
      <Box
        key={index}
        component="div"
        mb={2}
        p={2}
        border={1}
        borderColor="grey.300"
        borderRadius={1}
        display="flex"
        alignItems="flex-start"
        sx={{
          cursor: 'pointer',
        }}
        onClick={() => {
          setCollapseOpen((prev) => ({ ...prev, [index]: !prev[index] }));
        }}
        position="relative"
      >
        {/* Handle icon */}
        <Box sx={{ position: 'absolute', top: 5, right: 10 }}>
          {collapseOpen[index] ? (
            <Iconify icon="iconamoon:arrow-up-2-bold" width={20} color="text.secondary" />
          ) : (
            <Iconify icon="iconamoon:arrow-down-2-bold" width={20} color="text.secondary" />
          )}
        </Box>
        <Avatar src="/default-avatar.png" alt={feedback?.adminName || 'User'} sx={{ mr: 2 }} />

        <Box
          flexGrow={1}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'left',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', marginBottom: '2px' }}>
                {feedback.adminName || 'Unknown User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {feedback.role || 'No Role'}
              </Typography>
            </Box>
            <Chip
              label="REVISION REQUESTED"
              sx={{
                color: '#ff3b30',
                bgcolor: '#fff',
                border: '1px solid #ff3b30',
                borderBottom: '3px solid #ff3b30',
                borderRadius: 0.6,
                px: 1,
                '& .MuiChip-label': {
                  px: 1,
                  fontWeight: 650,
                },
                '&:hover': {
                  bgcolor: '#fff',
                },
              }}
            />
          </Box>
          <Collapse in={collapseOpen[index]} timeout="auto" unmountOnExit>
            <Box sx={{ textAlign: 'left', mt: 1 }}>
              {feedback?.content?.split('\n').map((line, i) => (
                <Typography key={i} variant="body2">
                  {line}
                </Typography>
              ))}

              {feedback?.type === 'video' && feedback.changes && (
                <Box mt={2}>
                  <Typography variant="subtitle2" color="warning.darker" sx={{ mb: 1 }}>
                    Videos that need changes:
                  </Typography>
                  <Stack spacing={2}>
                    {deliverables.videos
                      .filter(
                        (video) =>
                          video?.status === 'REVISION_REQUESTED' &&
                          feedback.changes.includes(video.id)
                      )
                      .map((video, videoIndex) => (
                        <Box
                          key={video.id}
                          sx={{
                            p: 2,
                            borderRadius: 1,
                            bgcolor: 'warning.lighter',
                            border: '1px solid',
                            borderColor: 'warning.main',
                          }}
                        >
                          <Stack direction="column" spacing={2}>
                            <Stack direction="column" spacing={1}>
                              <Box>
                                <Typography variant="subtitle2" color="warning.darker">
                                  Video {videoIndex + 1}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="warning.darker"
                                  sx={{ opacity: 0.8 }}
                                >
                                  Requires changes
                                </Typography>
                              </Box>

                              {feedback.reasons && feedback.reasons.length > 0 && (
                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                  {feedback.reasons.map((reason, idx) => (
                                    <Box
                                      key={idx}
                                      sx={{
                                        border: '1.5px solid #e7e7e7',
                                        borderBottom: '4px solid #e7e7e7',
                                        bgcolor: 'white',
                                        borderRadius: 1,
                                        p: 0.5,
                                        display: 'inline-flex',
                                      }}
                                    >
                                      <Chip
                                        label={reason}
                                        size="small"
                                        color="default"
                                        variant="outlined"
                                        sx={{
                                          border: 'none',
                                          color: '#8e8e93',
                                          fontSize: '0.75rem',
                                          padding: '1px 2px',
                                        }}
                                      />
                                    </Box>
                                  ))}
                                </Stack>
                              )}
                            </Stack>

                            <Box
                              sx={{
                                position: 'relative',
                                width: '100%',
                                paddingTop: '56.25%',
                                borderRadius: 1,
                                overflow: 'hidden',
                                bgcolor: 'black',
                              }}
                            >
                              <Box
                                component="video"
                                src={video.url}
                                controls
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                }}
                              />
                            </Box>
                          </Stack>
                        </Box>
                      ))}
                  </Stack>
                </Box>
              )}

              {feedback?.type === 'photo' && feedback.changes && (
                <Box mt={2}>
                  <Typography variant="subtitle2" color="warning.darker" sx={{ mb: 1 }}>
                    Photos that need changes:
                  </Typography>
                  <Stack spacing={2}>
                    {deliverables.photos
                      .filter(
                        (photo) =>
                          photo?.status === 'REVISION_REQUESTED' &&
                          feedback.changes.includes(photo.id)
                      )
                      .map((photo, photoIndex) => (
                        <Box
                          key={photo.id}
                          sx={{
                            p: 2,
                            borderRadius: 1,
                            bgcolor: 'warning.lighter',
                            border: '1px solid',
                            borderColor: 'warning.main',
                          }}
                        >
                          <Stack direction="column" spacing={2}>
                            <Stack direction="column" spacing={1}>
                              <Box>
                                <Typography variant="subtitle2" color="warning.darker">
                                  Photo {photoIndex + 1}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="warning.darker"
                                  sx={{ opacity: 0.8 }}
                                >
                                  Requires changes
                                </Typography>
                              </Box>
                            </Stack>
                            <Image src={photo.url} />
                          </Stack>
                        </Box>
                      ))}
                  </Stack>
                </Box>
              )}

              {feedback?.type === 'rawFootage' && feedback.changes && (
                <Box mt={2}>
                  <Typography variant="subtitle2" color="warning.darker" sx={{ mb: 1 }}>
                    Videos that need changes:
                  </Typography>
                  <Stack spacing={2}>
                    {deliverables.rawFootages
                      .filter(
                        (video) =>
                          video?.status === 'REVISION_REQUESTED' &&
                          feedback.changes.includes(video.id)
                      )
                      .map((video, videoIndex) => (
                        <Box
                          key={video.id}
                          sx={{
                            p: 2,
                            borderRadius: 1,
                            bgcolor: 'warning.lighter',
                            border: '1px solid',
                            borderColor: 'warning.main',
                          }}
                        >
                          <Stack direction="column" spacing={2}>
                            <Stack direction="column" spacing={1}>
                              <Box>
                                <Typography variant="subtitle2" color="warning.darker">
                                  Video {videoIndex + 1}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="warning.darker"
                                  sx={{ opacity: 0.8 }}
                                >
                                  Requires changes
                                </Typography>
                              </Box>

                              {feedback.reasons && feedback.reasons.length > 0 && (
                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                  {feedback.reasons.map((reason, idx) => (
                                    <Box
                                      key={idx}
                                      sx={{
                                        border: '1.5px solid #e7e7e7',
                                        borderBottom: '4px solid #e7e7e7',
                                        bgcolor: 'white',
                                        borderRadius: 1,
                                        p: 0.5,
                                        display: 'inline-flex',
                                      }}
                                    >
                                      <Chip
                                        label={reason}
                                        size="small"
                                        color="default"
                                        variant="outlined"
                                        sx={{
                                          border: 'none',
                                          color: '#8e8e93',
                                          fontSize: '0.75rem',
                                          padding: '1px 2px',
                                        }}
                                      />
                                    </Box>
                                  ))}
                                </Stack>
                              )}
                            </Stack>

                            <Box
                              sx={{
                                position: 'relative',
                                width: '100%',
                                paddingTop: '56.25%',
                                borderRadius: 1,
                                overflow: 'hidden',
                                bgcolor: 'black',
                              }}
                            >
                              <Box
                                component="video"
                                src={video.url}
                                controls
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                }}
                              />
                            </Box>
                          </Stack>
                        </Box>
                      ))}
                  </Stack>
                </Box>
              )}
            </Box>
          </Collapse>
        </Box>
      </Box>
    ));
}
